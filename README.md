## Installation & Usage

Because this project utilizes JavaScript ES6 Modules, it must be run through a local web server to bypass browser CORS restrictions (opening the file directly via `file://` will not work).

1. Clone the repository:
   ```bash
   git clone [https://github.com/jenn-y-sheng/simple-single-player-guan-dan.git](https://github.com/jenn-y-sheng/simple-single-player-guan-dan.git)

2. Ensure you have the required SVG card assets in your /images/SVG-cards-1.3/ directory.

3. Start a local server:

  a. Using VS Code: Install the Live Server extension. Right-click index.html and select "Open with Live Server".

  b. Using Python: Open your terminal in the project directory and run python3 -m http.server (or python -m http.server), then navigate to http://localhost:8000 in your browser.

  c. Using Node.js: Run npx http-server in the project directory.

4. Select your cards and click Play Cards, or click Pass to yield the turn.