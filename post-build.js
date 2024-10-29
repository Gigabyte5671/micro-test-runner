import fs from 'fs';

const filePath = process.argv[2];
const content = fs.readFileSync(filePath, { encoding: 'utf8' })
	.replace(/;\nclass/i, 'class')       // Remove the leading semicolon.
	.replace(/\/\/[^\n]+/ig, '')         // Remove inline comments.
	.replace(/\/\*[\s\S]*?\*\//ig, '')   // Remove block comments.
	.replace(/\n[\s\t]+\n/ig, '\n');     // Remove blank lines.
fs.writeFileSync(filePath, content, { encoding: 'utf8' });
filePath.startsWith('./dist') && fs.rmSync('./dist/tsconfig.tsbuildinfo');
