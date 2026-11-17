import {spawnSync} from 'node:child_process';
import {readdirSync} from 'node:fs';
const files=readdirSync('tests').filter(f=>f.endsWith('.test.ts')).map(f=>'tests/'+f);
const r=spawnSync(process.execPath,['--import','tsx','--test',...files],{stdio:'inherit',env:{...process.env,TSX_TSCONFIG_PATH:'tests/tsconfig.json'}});
process.exit(r.status??1);
