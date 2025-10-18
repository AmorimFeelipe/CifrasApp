import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox, filedialog
import requests
from bs4 import BeautifulSoup
import re
import os
import threading
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import sys

class BrowserChordScraper:
    def __init__(self, root):
        self.root = root
        self.root.title("Navegador de Cifras - Downloader .chords")
        self.root.geometry("1200x800")
        
        self.driver = None
        self.setup_ui()
        self.init_browser()
    
    def setup_ui(self):
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        nav_frame = ttk.Frame(main_frame)
        nav_frame.pack(fill=tk.X, pady=5)
        
        ttk.Button(nav_frame, text="← Voltar", command=self.browser_back).pack(side=tk.LEFT, padx=2)
        ttk.Button(nav_frame, text="→ Avançar", command=self.browser_forward).pack(side=tk.LEFT, padx=2)
        ttk.Button(nav_frame, text="🔄 Recarregar", command=self.browser_reload).pack(side=tk.LEFT, padx=2)
        
        self.url_entry = ttk.Entry(nav_frame, width=80)
        self.url_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)
        self.url_entry.bind('<Return>', self.navigate_to_url)
        
        ttk.Button(nav_frame, text="Ir", command=self.navigate_to_url).pack(side=tk.LEFT, padx=2)
        
        browser_frame = ttk.LabelFrame(main_frame, text="Navegador", padding="5")
        browser_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        
        status_frame = ttk.Frame(main_frame)
        status_frame.pack(fill=tk.X, pady=5)
        
        self.status_var = tk.StringVar(value="Pronto para navegar...")
        ttk.Label(status_frame, textvariable=self.status_var).pack(side=tk.LEFT)
        
        action_frame = ttk.Frame(main_frame)
        action_frame.pack(fill=tk.X, pady=5)
        
        ttk.Button(action_frame, text="📥 Extrair Cifra da Página Atual", 
                  command=self.extract_current_page, style="Accent.TButton").pack(side=tk.LEFT, padx=5)
        ttk.Button(action_frame, text="💾 Salvar como .chords", 
                  command=self.save_chords).pack(side=tk.LEFT, padx=5)
        ttk.Button(action_frame, text="🧹 Limpar", 
                  command=self.clear_output).pack(side=tk.LEFT, padx=5)
        
        info_frame = ttk.LabelFrame(main_frame, text="Informações da Música", padding="5")
        info_frame.pack(fill=tk.X, pady=5)
        
        info_grid = ttk.Frame(info_frame)
        info_grid.pack(fill=tk.X)
        
        ttk.Label(info_grid, text="Título:", width=10).grid(row=0, column=0, sticky=tk.W)
        self.title_var = tk.StringVar(value="N/A")
        ttk.Label(info_grid, textvariable=self.title_var, width=30).grid(row=0, column=1, sticky=tk.W)
        
        ttk.Label(info_grid, text="Artista:", width=10).grid(row=0, column=2, sticky=tk.W, padx=(20,0))
        self.artist_var = tk.StringVar(value="N/A")
        ttk.Label(info_grid, textvariable=self.artist_var, width=30).grid(row=0, column=3, sticky=tk.W)
        
        ttk.Label(info_grid, text="Tom:", width=10).grid(row=0, column=4, sticky=tk.W, padx=(20,0))
        self.key_var = tk.StringVar(value="N/A")
        ttk.Label(info_grid, textvariable=self.key_var, width=20).grid(row=0, column=5, sticky=tk.W)
        
        output_frame = ttk.LabelFrame(main_frame, text="Cifra Extraída", padding="5")
        output_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        
        self.text_area = scrolledtext.ScrolledText(output_frame, wrap=tk.WORD, font=("Courier New", 10))
        self.text_area.pack(fill=tk.BOTH, expand=True)
    
    def init_browser(self):
        def start_browser():
            try:
                self.status_var.set("Iniciando navegador...")
                chrome_options = Options()
                chrome_options.add_argument("--disable-blink-features=AutomationControlled")
                chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
                chrome_options.add_experimental_option('useAutomationExtension', False)
                chrome_options.add_argument("--disable-extensions")
                
                self.driver = webdriver.Chrome(options=chrome_options)
                self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
                
                self.driver.get("https://www.cifraclub.com")
                self.url_entry.delete(0, tk.END)
                self.url_entry.insert(0, self.driver.current_url)
                self.status_var.set("Navegador pronto! Navegue até uma cifra e clique em 'Extrair Cifra'")
                
            except Exception as e:
                messagebox.showerror("Erro", f"Erro ao iniciar navegador: {str(e)}")
                self.status_var.set("Erro ao iniciar navegador")
        
        browser_thread = threading.Thread(target=start_browser)
        browser_thread.daemon = True
        browser_thread.start()
    
    def navigate_to_url(self, event=None):
        url = self.url_entry.get().strip()
        if not url:
            return
        
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        def navigate():
            try:
                self.status_var.set("Navegando...")
                self.driver.get(url)
                self.url_entry.delete(0, tk.END)
                self.url_entry.insert(0, self.driver.current_url)
                self.status_var.set("Página carregada!")
            except Exception as e:
                self.status_var.set(f"Erro na navegação: {str(e)}")
        
        thread = threading.Thread(target=navigate)
        thread.daemon = True
        thread.start()
    
    def browser_back(self):
        if self.driver:
            try:
                self.driver.back()
                self.url_entry.delete(0, tk.END)
                self.url_entry.insert(0, self.driver.current_url)
            except Exception as e:
                messagebox.showerror("Erro", f"Erro ao voltar: {str(e)}")
    
    def browser_forward(self):
        if self.driver:
            try:
                self.driver.forward()
                self.url_entry.delete(0, tk.END)
                self.url_entry.insert(0, self.driver.current_url)
            except Exception as e:
                messagebox.showerror("Erro", f"Erro ao avançar: {str(e)}")
    
    def browser_reload(self):
        if self.driver:
            try:
                self.driver.refresh()
                self.status_var.set("Página recarregada!")
            except Exception as e:
                messagebox.showerror("Erro", f"Erro ao recarregar: {str(e)}")
    
    def extract_current_page(self):
        if not self.driver:
            messagebox.showerror("Erro", "Navegador não inicializado")
            return
        
        def extract():
            try:
                self.status_var.set("Extraindo cifra...")
                page_source = self.driver.page_source
                soup = BeautifulSoup(page_source, 'html.parser')
                
                self.extract_song_info(soup)
                chords_text = self.extract_and_format_chords(soup)
                
                self.root.after(0, self.update_output, chords_text)
                self.status_var.set("Cifra extraída com sucesso!")
                
            except Exception as e:
                self.root.after(0, lambda: messagebox.showerror("Erro", f"Erro ao extrair cifra: {str(e)}"))
                self.status_var.set("Erro na extração")
        
        thread = threading.Thread(target=extract)
        thread.daemon = True
        thread.start()
    
    def extract_song_info(self, soup):
        title_elem = soup.find('h1', class_='t1')
        title = title_elem.get_text().strip() if title_elem else "N/A"
        self.title_var.set(title)
        
        artist_elem = soup.find('h2', class_='t3')
        artist = "N/A"
        if artist_elem:
            artist_link = artist_elem.find('a')
            artist = artist_link.get_text().strip() if artist_link else "N/A"
        self.artist_var.set(artist)
        
        key_elem = soup.find('span', id='cifra_tom')
        key = "N/A"
        if key_elem:
            key_text = key_elem.get_text()
            key_match = re.search(r'Tom:\s*([A-G][#b]?)', key_text)
            key = key_match.group(1) if key_match else "N/A"
        self.key_var.set(key)
    
    def extract_and_format_chords(self, soup):
        cifra_container = soup.find('div', class_='cifra_cnt')
        if not cifra_container:
            return "Cifra não encontrada na página atual."
        
        pre_element = cifra_container.find('pre')
        if not pre_element:
            return "Estrutura da cifra não encontrada."
        
        raw_text = pre_element.get_text(separator='', strip=False)
        formatted_chords = self.clean_chord_text(raw_text)
        return formatted_chords

    def clean_chord_text(self, text):
        lines = text.splitlines()
        cleaned_lines = []

        for line in lines:
            if not line.strip():
                cleaned_lines.append("")
                continue

            if re.search(r'[eBGDAE]\|', line) or '---' in line:
                continue

            line = re.sub(r'<[^>]+>', '', line)
            cleaned_lines.append(line.rstrip())

        return "\n".join(cleaned_lines)
    
    def update_output(self, text):
        self.text_area.delete(1.0, tk.END)
        self.text_area.insert(1.0, text)
    
    def save_chords(self):
        chords_text = self.text_area.get(1.0, tk.END).strip()
        if not chords_text or chords_text.startswith("Cifra não encontrada"):
            messagebox.showerror("Erro", "Nenhuma cifra válida para salvar.")
            return
        
        title = self.title_var.get() or "cifra"
        artist = self.artist_var.get() or "artista"
        
        safe_title = re.sub(r'[^\w\s-]', '', title)
        safe_artist = re.sub(r'[^\w\s-]', '', artist)
        default_filename = f"{safe_artist} - {safe_title}.chords"
        
        filename = filedialog.asksaveasfilename(
            defaultextension=".chords",
            initialfile=default_filename,
            filetypes=[("Arquivos de cifra", "*.chords"), ("Todos os arquivos", "*.*")]
        )
        
        if filename:
            try:
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(f"Título: {title}\n")
                    f.write(f"Artista: {artist}\n")
                    f.write(f"Tom: {self.key_var.get()}\n")
                    f.write(f"URL: {self.url_entry.get()}\n")
                    f.write(f"Extraído em: {time.strftime('%d/%m/%Y %H:%M:%S')}\n")
                    f.write("=" * 60 + "\n\n")
                    f.write(chords_text)
                
                messagebox.showinfo("Sucesso", f"Cifra salva como:\n{filename}")
                self.status_var.set(f"Arquivo salvo: {os.path.basename(filename)}")
                
            except Exception as e:
                messagebox.showerror("Erro", f"Erro ao salvar arquivo: {str(e)}")
    
    def clear_output(self):
        self.text_area.delete(1.0, tk.END)
        self.title_var.set("N/A")
        self.artist_var.set("N/A")
        self.key_var.set("N/A")
        self.status_var.set("Saída limpa")
    
    def on_closing(self):
        if self.driver:
            self.driver.quit()
        self.root.destroy()

def main():
    root = tk.Tk()

    # --- BLOCO DE CONFIGURAÇÃO DO ÍCONE ---
    try:
        root.iconbitmap(sys.executable)  # Ícone embutido no .exe (PyInstaller)
    except tk.TclError as e:
        try:
            root.iconbitmap('icon.ico')  # Fallback para desenvolvimento
        except tk.TclError:
            print(f"Aviso: Falha ao definir ícone da janela ({e}). Verifique 'icon.ico'.")
            pass
    # --------------------------------------

    app = BrowserChordScraper(root)
    root.protocol("WM_DELETE_WINDOW", app.on_closing)
    root.mainloop()

if __name__ == "__main__":
    main()
