#!/usr/bin/env python3
"""Linux x86_64 host proof: inject at the real settle append syscall.
No library/store replacement: ptrace refuses the kernel write with ENOSPC,
or SIGKILLs the writer immediately before that write can acknowledge.
"""
import ctypes
import errno
import json
import os
import platform
import signal
import sys

if platform.system() != 'Linux' or platform.machine() != 'x86_64':
    raise SystemExit('host proof requires Linux x86_64 ptrace')
mode, evidence, *command = sys.argv[1:]
if mode not in ('enospc', 'kill') or not command:
    raise SystemExit('usage: settle-fault.py enospc|kill evidence command ...')
libc = ctypes.CDLL(None, use_errno=True)
libc.ptrace.restype = ctypes.c_long
class Registers(ctypes.Structure):
    _fields_ = [(name, ctypes.c_ulonglong) for name in
                'r15 r14 r13 r12 rbp rbx r11 r10 r9 r8 rax rcx rdx rsi rdi orig_rax rip cs eflags rsp ss fs_base gs_base ds es fs gs'.split()]
def ptrace(request, pid, addr=0, data=0):
    result = libc.ptrace(request, pid, ctypes.c_void_p(addr), data)
    if result == -1:
        raise OSError(ctypes.get_errno(), os.strerror(ctypes.get_errno()))
    return result
pid = os.fork()
if pid == 0:
    try:
        ptrace(0, 0)
        os.execvp(command[0], command)
    except BaseException as error:
        print(str(error), file=sys.stderr)
        os._exit(125)
reaped = False
try:
    _, status = os.waitpid(pid, 0)
    if not os.WIFSTOPPED(status):
        reaped = True
        raise RuntimeError('ptrace capability unavailable: child failed before trace stop')
    ptrace(0x4200, pid, 0, 1)  # SETOPTIONS / TRACESYSGOOD
    entering = True
    injected = False
    refused = False
    deliver = 0
    while True:
        ptrace(24, pid, 0, deliver)  # SYSCALL
        deliver = 0
        _, status = os.waitpid(pid, 0)
        if os.WIFEXITED(status) or os.WIFSIGNALED(status):
            reaped = True
            break
        stopped = os.WSTOPSIG(status)
        if stopped != (signal.SIGTRAP | 0x80):
            if stopped != signal.SIGTRAP:
                deliver = stopped
            continue
        regs = Registers()
        ptrace(12, pid, 0, ctypes.byref(regs))
        if entering and regs.orig_rax == 1 and not injected:
            try:
                target = os.readlink(f'/proc/{pid}/fd/{regs.rdi}')
            except OSError:
                target = ''
            if target.endswith('/fgos/events/project/active.jsonl'):
                with open(f'/proc/{pid}/mem', 'rb', buffering=0) as memory:
                    memory.seek(regs.rsi)
                    data = memory.read(min(regs.rdx, 1048576))
                if b'work.attempt' in data:
                    injected = True
                    with open(evidence, 'w') as output:
                        json.dump({'mode': mode, 'pid': pid, 'syscall': 'write', 'path': target, 'containsSettleAttempt': True}, output)
                    if mode == 'kill':
                        os.kill(pid, signal.SIGKILL)
                        _, status = os.waitpid(pid, 0)
                        reaped = True
                        break
                    else:
                        regs.orig_rax = (1 << 64) - 1
                        ptrace(13, pid, 0, ctypes.byref(regs))
                        refused = True
        elif not entering and refused:
            regs.rax = (1 << 64) - errno.ENOSPC
            ptrace(13, pid, 0, ctypes.byref(regs))
            refused = False
        entering = not entering
    if not injected:
        raise RuntimeError('no settle append intercepted; proof did not run')
    if mode == 'kill' and not (os.WIFSIGNALED(status) and os.WTERMSIG(status) == signal.SIGKILL):
        raise RuntimeError('writer was not killed')
    if mode == 'enospc' and not (os.WIFEXITED(status) and os.WEXITSTATUS(status) == 0):
        raise RuntimeError('writer did not verify ENOSPC refusal')
finally:
    if not reaped:
        try:
            os.kill(pid, signal.SIGKILL)
            os.waitpid(pid, 0)
        except ProcessLookupError:
            pass
