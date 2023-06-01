import fs from 'fs';
import https from 'https';
import querystring from 'querystring';

const fileContent = fs.readFileSync('./dist/index.js', { encoding: 'utf8' });

const query = querystring.stringify({ input: fileContent });

const request = https.request(
	{
		method   : 'POST',
		hostname : 'www.toptal.com',
		path     : '/developers/javascript-minifier/api/raw'
	},
	(response) => {
		if (response.statusCode !== 200) {
			console.log('Failed to minify:' + response.statusCode);
			return;
		}

		let minifiedContent = '';

		response.on('data', (chunk) => { minifiedContent += chunk; });

		response.on('end', () => {
			fs.writeFileSync('./dist/index.min.js', minifiedContent, { encoding: 'utf8' });
			fs.renameSync('./dist/index.d.ts', './dist/index.min.d.ts');
			fs.unlinkSync('./dist/index.js');
		});
	}
);
request.on('error', (error) => { throw error; });
request.setHeader('Content-Type', 'application/x-www-form-urlencoded');
request.setHeader('Content-Length', query.length);
request.end(query, 'utf8');
