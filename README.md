# Project Setup

This project requires **Python 3.13** or later.

## Prerequisites

- Python 3.13+
- pip (comes with Python)
- Git

Verify your installation:

```bash
python --version
```

or

```bash
python3 --version
```

Expected output:

```text
Python 3.13.x
```

---

# Installation

## Windows

### 1. Install Python

Download and install Python 3.13 from:

https://www.python.org/downloads/windows/

> **Important:** During installation, check **"Add Python to PATH"**.

Verify:

```powershell
python --version
```

### 2. Clone the repository

```powershell
git clone <repository-url>
cd <project-name>
```

### 3. Create a virtual environment

```powershell
python -m venv .venv
```

### 4. Activate the virtual environment

PowerShell

```powershell
.venv\Scripts\Activate.ps1
```

Command Prompt

```cmd
.venv\Scripts\activate.bat
```

### 5. Install dependencies

```powershell
pip install -r requirements.txt
```

### 6. Run the application

```powershell
python main.py
```

---

## macOS

### 1. Install Python

Using Homebrew (recommended)

```bash
brew install python@3.13
```

Or install from:

https://www.python.org/downloads/macos/

Verify:

```bash
python3 --version
```

### 2. Clone the repository

```bash
git clone <repository-url>
cd <project-name>
```

### 3. Create a virtual environment

```bash
python3 -m venv .venv
```

### 4. Activate the virtual environment

```bash
source .venv/bin/activate
```

### 5. Install dependencies

```bash
pip install -r requirements.txt
```

### 6. Run the application

```bash
python main.py
```

If `python` is not available:

```bash
python3 main.py
```

---

## Linux (Ubuntu/Debian)

### 1. Install Python

```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
```

Verify:

```bash
python3 --version
```

> If your distribution does not yet provide Python 3.13, install it from the official Python source or your distribution's recommended repository.

### 2. Clone the repository

```bash
git clone <repository-url>
cd <project-name>
```

### 3. Create a virtual environment

```bash
python3 -m venv .venv
```

### 4. Activate the virtual environment

```bash
source .venv/bin/activate
```

### 5. Install dependencies

```bash
pip install -r requirements.txt
```

### 6. Run the application

```bash
python main.py
```

or

```bash
python3 main.py
```

---

# Updating Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

# Deactivating the Virtual Environment

```bash
deactivate
```

---

# Project Structure

```
project/
├── .venv/
├── src/
├── tests/
├── requirements.txt
├── README.md
└── main.py
```

---

# Troubleshooting

## `python` command not found

Try:

```bash
python3 --version
```

If it works, use `python3` instead of `python`.

---

## `pip` command not found

Run:

```bash
python -m pip --version
```

or

```bash
python3 -m pip --version
```

---

## Verify the virtual environment

Windows

```powershell
where python
```

macOS/Linux

```bash
which python
```

The output should point to the `.venv` directory.