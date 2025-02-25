# tensor_expressions_webapp

## Project Setup

### 1. Install Node.js
```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Install Node.js and npm
sudo apt-get install -y nodejs

# Verify installation
node -v && npm -v
```

### Bare Node.js Installation

1. **Clone the repository:**
    ```sh
    git clone https://github.com/yourusername/tensor_expressions_webapp.git
    cd tensor_expressions_webapp
    ```

2. **Install dependencies:**
    ```sh
    npm install
    ```

3. **Run the application:**
    ```sh
    npm run dev
    ```

4. **Open your browser and navigate to:**
    ```
    http://localhost:5173/tensor_expressions_webapp/
    ```

### Docker Installation

```bash
# Build Docker image
docker-compose build

# Start container
docker-compose up

# Access at http://localhost:4173/tensor_expressions_webapp/
```

### GitHub Pages Deployment

The project is deployed on GitHub Pages. You can find the live version at:
```
https://seriousseal.github.io/tensor_expressions_webapp/
```