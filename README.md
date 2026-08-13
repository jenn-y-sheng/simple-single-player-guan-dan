## Installation & Usage

Because this project utilizes JavaScript ES6 Modules, it must be run through a local web server to bypass browser CORS restrictions (opening the file directly via `file://` will not work).

1. Clone the repository:
```bash
   git clone https://github.com/jenn-y-sheng/simple-single-player-guan-dan.git
```

2. Ensure you have the required SVG card assets in your `/images/SVG-cards-1.3/` directory.

3. Start a local server using one of the following methods:

   - **VS Code**: Install the Live Server extension, then right-click `index.html` and select "Open with Live Server".
   - **Python**: Open your terminal in the project directory and run:
```bash
     python3 -m http.server
```
     (or `python -m http.server`), then navigate to `http://localhost:8000` in your browser.
   - **Node.js**: Run the following in the project directory:
```bash
     npx http-server
```

4. Select your cards and click **Play Cards**, or click **Pass** to yield the turn.