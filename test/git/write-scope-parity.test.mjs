// Execute the unchanged golden suite through the native leaf as well as Node.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { ensureGitAddon, root } from '../helpers/git-addon.mjs';
const built=ensureGitAddon();
const facade=`
import { loadNativeAddon } from ${JSON.stringify(pathToFileURL(root+'/src/git/native.mjs').href)};
const native=loadNativeAddon(${JSON.stringify({descriptor:{manifest:JSON.parse(fs.readFileSync(built.manifest)),releaseRoot:root}})});
export class WriteScopeError extends Error { constructor(message){super(message);this.name='WriteScopeError';} }
const call=(method,args)=>{try{return native.writeScope(method,args);}catch(e){throw new WriteScopeError(e.message);}};
export const canonicalizeWriteEntry=raw=>call('canonicalize',{raw});
export const canonicalizeWrites=scope=>call('canonicalizeAll',{scope});
export const expandGenerated=(scope,mappings=[])=>call('expand',{scope,mappings});
export const matchesWriteScope=(path,scope)=>typeof path==='string'&&call('matches',{path,scope});
export const partitionPaths=(paths,scope)=>({inScope:paths.filter(p=>matchesWriteScope(p,scope)),outOfScope:paths.filter(p=>!matchesWriteScope(p,scope))});
`;
const source=fs.readFileSync(new URL('../runner/write-scope.test.mjs',import.meta.url),'utf8').replace('../../src/runner/dispatch/write-scope.mjs','data:text/javascript;base64,'+Buffer.from(facade).toString('base64'));
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
await import('../runner/write-scope.test.mjs');
