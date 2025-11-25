import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox, filedialog
import requests
from bs4 import BeautifulSoup
import re
import os
import threading
import time
import sys

class FastChordScraper:
    def __init__(self, root):
        self.root = root
        self.root.title("Extrator de Cifras - Ultra Rápido")
        self.root.geometry("1000x700")
        self.setup_ui()
    
    def setup_ui(self):
        # Estilo
        style = ttk.Style()
        style.configure("TButton", padding=6)
        style.configure("TLabel", padding=2)
        
        main_frame = ttk.Frame(self.root, padding="15")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Área de Input
        input_frame = ttk.LabelFrame(main_frame, text="URL da Cifra (CifraClub)", padding="10")
        input_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.url_entry = ttk.Entry(input_frame, width=80)
        self.url_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))
        self.url_entry.bind('<Return>', lambda e: self.extract_data())
        
        ttk.Button(input_frame, text="🚀 Extrair Agora", command=self.extract_data).pack(side=tk.LEFT)

        # Info da Música
        info_frame = ttk.LabelFrame(main_frame, text="Metadados Detectados", padding="10")
        info_frame.pack(fill=tk.X, pady=(0, 10))
        
        grid_frame = ttk.Frame(info_frame)
        grid_frame.pack(fill=tk.X)
        
        # Inputs de metadados (editáveis)
        ttk.Label(grid_frame, text="Título:").grid(row=0, column=0, sticky="w")
        self.title_var = tk.StringVar()
        ttk.Entry(grid_frame, textvariable=self.title_var, width=30).grid(row=0, column=1, padx=5, sticky="w")
        
        ttk.Label(grid_frame, text="Artista:").grid(row=0, column=2, sticky="w")
        self.artist_var = tk.StringVar()
        ttk.Entry(grid_frame, textvariable=self.artist_var, width=30).grid(row=0, column=3, padx=5, sticky="w")
        
        ttk.Label(grid_frame, text="Tom:").grid(row=0, column=4, sticky="w")
        self.key_var = tk.StringVar()
        ttk.Entry(grid_frame, textvariable=self.key_var, width=10).grid(row=0, column=5, padx=5, sticky="w")

        # Área de Texto
        output_frame = ttk.LabelFrame(main_frame, text="Conteúdo da Cifra", padding="5")
        output_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        self.text_area = scrolledtext.ScrolledText(output_frame, font=("Courier New", 11), wrap=tk.WORD)
        self.text_area.pack(fill=tk.BOTH, expand=True)
        
        # Botões de Ação
        action_frame = ttk.Frame(main_frame)
        action_frame.pack(fill=tk.X)
        
        self.status_var = tk.StringVar(value="Pronto.")
        ttk.Label(action_frame, textvariable=self.status_var, foreground="gray").pack(side=tk.LEFT)
        
        ttk.Button(action_frame, text="💾 Salvar .chords", command=self.save_file).pack(side=tk.RIGHT)
        ttk.Button(action_frame, text="🧹 Limpar", command=self.clear_all).pack(side=tk.RIGHT, padx=5)

    def extract_data(self):
        url = self.url_entry.get().strip()
        if not url:
            messagebox.showwarning("Atenção", "Cole uma URL primeiro.")
            return
            
        if not url.startswith('http'):
            url = 'https://' + url

        def run():
            try:
                self.status_var.set("Baixando HTML...")
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
                response = requests.get(url, headers=headers, timeout=10)
                response.raise_for_status()
                
                self.status_var.set("Processando dados...")
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extração Inteligente
                title = soup.find('h1', class_='t1').text.strip() if soup.find('h1', class_='t1') else "Desconhecido"
                artist = soup.find('h2', class_='t3').text.strip() if soup.find('h2', class_='t3') else "Desconhecido"
                
                # Tenta achar o tom
                key_elem = soup.find('span', id='cifra_tom')
                tom = "N/A"
                if key_elem:
                    match = re.search(r'([A-G][#b]?)', key_elem.find('a').text if key_elem.find('a') else key_elem.text)
                    if match: tom = match.group(1)

                # Extrai o container da cifra (pre)
                cifra_container = soup.find('pre')
                content = ""
                if cifra_container:
                    # Remove tags internas indesejadas mas mantém quebras de linha
                    content = "".join([str(x) for x in cifra_container.contents])
                    # Limpa tags HTML residuais
                    content = re.sub(r'<[^>]+>', '', content)
                    # Limpa tablaturas (linhas com hífens longos ou cordas E| B|)
                    content = self.clean_tabs(content)
                else:
                    content = "Erro: Container da cifra não encontrado."

                # Atualiza GUI na thread principal
                self.root.after(0, lambda: self.update_fields(title, artist, tom, content))
                
            except Exception as e:
                self.root.after(0, lambda: messagebox.showerror("Erro", f"Falha na extração: {str(e)}"))
                self.status_var.set("Erro na extração.")

        threading.Thread(target=run, daemon=True).start()

    def clean_tabs(self, text):
        lines = text.splitlines()
        clean_lines = []
        for line in lines:
            # Remove linhas de tablatura (com muitos hifens ou marcadores de corda)
            if re.search(r'[eBGDAE]\|', line) or line.count('-') > 6:
                continue
            clean_lines.append(line)
        return "\n".join(clean_lines)

    def update_fields(self, title, artist, tom, content):
        self.title_var.set(title)
        self.artist_var.set(artist)
        self.key_var.set(tom)
        self.text_area.delete(1.0, tk.END)
        self.text_area.insert(1.0, content)
        self.status_var.set("Sucesso!")

    def save_file(self):
        content = self.text_area.get(1.0, tk.END).strip()
        if not content:
            return
            
        artist = self.artist_var.get().strip() or "Artista"
        title = self.title_var.get().strip() or "Titulo"
        
        # Formato de arquivo solicitado
        filename_suggestion = f"{artist} - {title}.chords"
        # Limpa caracteres ilegais no nome do arquivo
        filename_suggestion = re.sub(r'[<>:"/\\|?*]', '', filename_suggestion)

        filepath = filedialog.asksaveasfilename(
            defaultextension=".chords",
            initialfile=filename_suggestion,
            filetypes=[("Arquivos Chord", "*.chords"), ("Texto", "*.txt")]
        )
        
        if filepath:
            with open(filepath, "w", encoding="utf-8") as f:
                # Cabeçalho padrão para seu parser
                f.write(f"Título: {title}\n")
                f.write(f"Artista: {artist}\n")
                f.write(f"Tom: {self.key_var.get()}\n")
                f.write("="*20 + "\n\n")
                f.write(content)
            self.status_var.set(f"Salvo em {os.path.basename(filepath)}")

    def clear_all(self):
        self.url_entry.delete(0, tk.END)
        self.title_var.set("")
        self.artist_var.set("")
        self.key_var.set("")
        self.text_area.delete(1.0, tk.END)
        self.status_var.set("Limpo.")

if __name__ == "__main__":
    root = tk.Tk()
    try:
        root.iconbitmap(sys.executable) 
    except: pass
    app = FastChordScraper(root)
    root.mainloop()
