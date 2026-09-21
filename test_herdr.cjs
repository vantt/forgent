const { execSync } = require('child_process');
try {
  execSync('herdr pane run wS:p33Q echo "hello world"', { stdio: 'inherit' });
} catch (err) {
  console.log("Error:", err);
}
