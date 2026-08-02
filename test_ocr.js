const fs = require('fs');

async function test() {
  const image = fs.readFileSync('test_image.jpg');
  
  // Construct a multipart form-data payload manually
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const header = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="receipt"; filename="test_image.jpg"\r\n` +
    `Content-Type: image/jpeg\r\n\r\n`
  );
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
  
  const body = Buffer.concat([header, image, footer]);
  
  try {
    const res = await fetch('https://server-seven-gamma-95.vercel.app/parse-receipt', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch(e) {
    console.error(e);
  }
}

test();
