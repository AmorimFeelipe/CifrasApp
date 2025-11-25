import subprocess
import os

# --- Configurações ---
APP_NAME = "cifrasApp"
SCRIPT_FILE = f"{APP_NAME}.py"
ICON_FILE = "icon.ico"
OUTPUT_DIR = "dist"

# --- Validação ---
if not os.path.exists(SCRIPT_FILE):
    print(f"ERRO: O script principal '{SCRIPT_FILE}' não foi encontrado!")
    exit(1)

if not os.path.exists(ICON_FILE):
    print(f"AVISO: O ícone '{ICON_FILE}' não foi encontrado. Um ícone padrão será usado.")
    ICON_FILE = None # PyInstaller usará o padrão

# --- Comando PyInstaller ---
command = [
    "pyinstaller",
    "--onefile",       # Gera um único executável
    "--windowed",      # Sem console de terminal no fundo
    "--name", APP_NAME, # Nome do executável final
    "--distpath", OUTPUT_DIR, # Pasta de saída
]

if ICON_FILE:
    command.extend(["--icon", ICON_FILE])

command.append(SCRIPT_FILE)

# --- Execução ---
print("="*50)
print(f"Executando PyInstaller para '{SCRIPT_FILE}'...")
print(f"Comando: {' '.join(command)}")
print("="*50)

try:
    subprocess.run(command, check=True, text=True)
    print("\nSUCESSO! O executável foi criado em:")
    print(os.path.abspath(OUTPUT_DIR))
except FileNotFoundError:
    print("\nERRO: O comando 'pyinstaller' não foi encontrado.")
    print("Por favor, instale o PyInstaller com: pip install pyinstaller")
except subprocess.CalledProcessError as e:
    print(f"\nERRO: O PyInstaller falhou com o código de saída {e.returncode}.")
    print("Verifique os logs acima para mais detalhes.")
except Exception as e:
    print(f"\nERRO INESPERADO: {e}")

print("="*50)
