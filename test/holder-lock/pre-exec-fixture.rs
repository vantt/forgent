// Test-only native fork window. Child code uses async-signal-safe syscalls only.
use std::ffi::{c_char, c_int, c_void};
type Env = *mut c_void;
type Value = *mut c_void;
type Info = *mut c_void;
extern "C" {
    fn fork() -> c_int;
    fn usleep(micros: u32) -> c_int;
    fn execv(path: *const c_char, argv: *const *const c_char) -> c_int;
    fn _exit(code: c_int) -> !;
    fn waitpid(pid: c_int, status: *mut c_int, flags: c_int) -> c_int;
    fn napi_create_int32(env: Env, n: c_int, value: *mut Value) -> c_int;
    fn napi_get_value_int32(env: Env, value: Value, n: *mut c_int) -> c_int;
    fn napi_get_cb_info(
        env: Env,
        info: Info,
        argc: *mut usize,
        argv: *mut Value,
        this: *mut Value,
        data: *mut *mut c_void,
    ) -> c_int;
    fn napi_create_function(
        env: Env,
        name: *const c_char,
        len: usize,
        cb: unsafe extern "C" fn(Env, Info) -> Value,
        data: *mut c_void,
        result: *mut Value,
    ) -> c_int;
    fn napi_set_named_property(env: Env, object: Value, name: *const c_char, value: Value)
        -> c_int;
}
unsafe extern "C" fn start(env: Env, _: Info) -> Value {
    let pid = fork();
    if pid == 0 {
        usleep(750_000);
        let path = b"/bin/true\0".as_ptr().cast();
        let argv = [path, std::ptr::null()];
        execv(path, argv.as_ptr());
        _exit(127);
    }
    let mut value = std::ptr::null_mut();
    napi_create_int32(env, pid, &mut value);
    value
}
unsafe extern "C" fn wait(env: Env, info: Info) -> Value {
    let mut argc = 1;
    let mut arg = std::ptr::null_mut();
    napi_get_cb_info(
        env,
        info,
        &mut argc,
        &mut arg,
        std::ptr::null_mut(),
        std::ptr::null_mut(),
    );
    let mut pid = 0;
    napi_get_value_int32(env, arg, &mut pid);
    let mut status = -1;
    if pid > 1 {
        waitpid(pid, &mut status, 0);
    }
    let mut value = std::ptr::null_mut();
    napi_create_int32(env, status, &mut value);
    value
}
#[no_mangle]
pub unsafe extern "C" fn napi_register_module_v1(env: Env, exports: Value) -> Value {
    for (name, callback) in [
        (
            b"start\0".as_slice(),
            start as unsafe extern "C" fn(Env, Info) -> Value,
        ),
        (b"wait\0".as_slice(), wait),
    ] {
        let mut value = std::ptr::null_mut();
        napi_create_function(
            env,
            name.as_ptr().cast(),
            name.len() - 1,
            callback,
            std::ptr::null_mut(),
            &mut value,
        );
        napi_set_named_property(env, exports, name.as_ptr().cast(), value);
    }
    exports
}
