import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox, filedialog
import requests
from bs4 import BeautifulSoup
import re
import os
import threading
import json
import sys
import urllib.parse
import random

class FastChordScraper:
    def __init__(self, root):
        self.root = root
        self.root.title("CifrasApp - Busca Universal v3.3 (Corrigido)")
        self.root.geometry("950x700")
        self.setup_ui()
    
    def setup_ui(self):
        style = ttk.Style()
        style.theme_use('clam')
        
        self.colors = {
            "bg": "#0f172a", "fg": "#f1f5f9", "accent": "#3b82f6", 
            "success": "#10b981", "input_bg": "#1e293b", "text_bg": "#020617",
        }
        
        self.root.configure(bg=self.colors["bg"])
        
        style.configure("TFrame", background=self.colors["bg"])
        style.configure("TLabel", background=self.colors["bg"], foreground=self.colors["fg"], font=("Segoe UI", 10))
        style.configure("TCheckbutton", background=self.colors["bg"], foreground=self.colors["fg"], font=("Segoe UI", 10))
        style.configure("TLabelframe", background=self.colors["bg"], foreground=self.colors["fg"], relief="solid", borderwidth=1)
        style.configure("TLabelframe.Label", background=self.colors["bg"], foreground=self.colors["accent"], font=("Segoe UI", 11, "bold"))
        style.map("TCheckbutton", background=[('active', self.colors["bg"])])

        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # --- 1. RODAPÉ (Botões Fixos) ---
        action_frame = ttk.Frame(main_frame)
        action_frame.pack(side=tk.BOTTOM, fill=tk.X, pady=(15, 0))
        
        self.status_var = tk.StringVar(value="Digite o nome da música e aperte Enter.")
        tk.Label(action_frame, textvariable=self.status_var, bg=self.colors["bg"], fg="#64748b", font=("Segoe UI", 9)).pack(side=tk.LEFT)
        
        btn_clean = tk.Button(action_frame, text="Limpar", command=self.clear_all, bg="#475569", fg="white", relief="flat", padx=15, pady=5, font=("Segoe UI", 9))
        btn_clean.pack(side=tk.RIGHT, padx=(10, 0))

        btn_save = tk.Button(action_frame, text="💾 Salvar JSON", command=self.save_file, bg=self.colors["success"], fg="white", relief="flat", padx=20, pady=5, font=("Segoe UI", 10, "bold"))
        btn_save.pack(side=tk.RIGHT)

        # --- 2. ÁREA DE PESQUISA (Topo) ---
        top_frame = ttk.Frame(main_frame)
        top_frame.pack(side=tk.TOP, fill=tk.X, pady=(0, 15))

        lbl_title = tk.Label(top_frame, text="🎵 O que vamos tocar?", bg=self.colors["bg"], fg=self.colors["fg"], font=("Segoe UI", 16, "bold"))
        lbl_title.pack(anchor="w", pady=(0, 10))

        search_container = tk.Frame(top_frame, bg=self.colors["bg"])
        search_container.pack(fill=tk.X)
        
        self.url_entry = tk.Entry(search_container, font=("Segoe UI", 12), bg=self.colors["input_bg"], fg="white", insertbackground="white", relief="flat", bd=5)
        self.url_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10), ipady=5)
        self.url_entry.bind('<Return>', lambda e: self.start_search())
        self.url_entry.focus()
        
        self.btn_search = tk.Button(search_container, text="🔍 Pesquisar", command=self.start_search, bg=self.colors["accent"], fg="white", relief="flat", font=("Segoe UI", 11, "bold"), padx=20)
        self.btn_search.pack(side=tk.LEFT)

        self.simplify_var = tk.BooleanVar(value=False)
        chk = ttk.Checkbutton(top_frame, text="Priorizar versão simplificada (sem solos/tabs)", variable=self.simplify_var)
        chk.pack(anchor="w", pady=(10, 0))

        # --- 3. DADOS DETECTADOS (Meio) ---
        info_frame = ttk.LabelFrame(main_frame, text="Informações da Música", padding="15")
        info_frame.pack(fill=tk.X, pady=(0, 15))
        
        info_grid = tk.Frame(info_frame, bg=self.colors["bg"])
        info_grid.pack(fill=tk.X)

        self.title_var = tk.StringVar()
        self.artist_var = tk.StringVar()
        self.key_var = tk.StringVar()

        def make_field(parent, label, var, c, w=30):
            tk.Label(parent, text=label, bg=self.colors["bg"], fg="#94a3b8").grid(row=0, column=c*2, sticky="w", pady=5)
            entry = tk.Entry(parent, textvariable=var, width=w, bg=self.colors["input_bg"], fg="white", relief="flat", font=("Segoe UI", 10))
            entry.grid(row=0, column=c*2+1, padx=(5, 20), sticky="w", ipady=3)

        make_field(info_grid, "Música:", self.title_var, 0, 35)
        make_field(info_grid, "Artista:", self.artist_var, 1, 35)
        make_field(info_grid, "Tom:", self.key_var, 2, 10)

        # --- 4. RESULTADO (Texto) ---
        self.text_area = scrolledtext.ScrolledText(
            main_frame, font=("Consolas", 11), 
            bg=self.colors["text_bg"], fg=self.colors["fg"], 
            insertbackground="white", borderwidth=0, padx=10, pady=10
        )
        self.text_area.pack(fill=tk.BOTH, expand=True)

    # --- MOTOR DE BUSCA MULTI-ENGINE ---

    def start_search(self):
        query = self.url_entry.get().strip()
        if not query: return
        
        if query.startswith('http'):
            self.process_url(query)
            return

        threading.Thread(target=self.run_multi_search, args=(query,), daemon=True).start()

    def run_multi_search(self, query):
        clean_query = re.sub(r'cifra\s*club|cifra|acorde', '', query, flags=re.IGNORECASE).strip()
        search_term = f"site:cifraclub.com.br {clean_query}"
        
        results = []
        
        # 1. Tentar Google
        self.update_status("Tentando Google...")
        results.extend(self.search_google(search_term))
        
        # 2. Tentar DuckDuckGo
        if not results:
            self.update_status("Google falhou. Tentando DuckDuckGo...")
            results.extend(self.search_ddg(search_term))
            
        # 3. Tentar Bing
        if not results:
            self.update_status("Tentando Bing...")
            results.extend(self.search_bing(search_term))

        # Resultado Final
        if results:
            self.root.after(0, lambda: self.show_selection_window(results))
        else:
            self.update_status("Nenhum resultado encontrado. Tente novamente ou cole o link.")
            self.root.after(0, lambda: messagebox.showwarning("404", "Não encontrei essa cifra."))

    def get_browser_headers(self, engine='google'):
        # Cabeçalhos quebrados em múltiplas strings literais são concatenados automaticamente pelo Python
        if engine == 'google':
            return {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                              'AppleWebKit/537.36 (KHTML, like Gecko) '
                              'Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        return {'User-Agent': 'Mozilla/5.0'} # Headers mais simples para DDG/Bing

    def search_google(self, term):
        try:
            url = f"https://www.google.com/search?q={urllib.parse.quote(term)}&num=10"
            resp = requests.get(url, headers=self.get_browser_headers('google'), timeout=10)
            if resp.status_code != 200: return []
            
            soup = BeautifulSoup(resp.text, 'html.parser')
            results = []
            for g in soup.find_all('div', class_='g'):
                a = g.find('a')
                if a and a.get('href') and 'cifraclub.com.br' in a.get('href'):
                    title_elem = g.find('h3')
                    title = title_elem.text if title_elem else a.get('href')
                    if '/letra/' not in a.get('href'):
                        results.append({'title': title, 'url': a.get('href')})
            return results
        except: return []

    def search_ddg(self, term):
        try:
            url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(term)}"
            resp = requests.get(url, headers=self.get_browser_headers(), timeout=10)
            soup = BeautifulSoup(resp.text, 'html.parser')
            results = []
            for a in soup.find_all('a', class_='result__a'):
                href = a.get('href')
                if 'uddg=' in href: # Decodifica
                    href = urllib.parse.parse_qs(urllib.parse.urlparse(href).query).get('uddg', [href])[0]
                if 'cifraclub.com.br' in href and '/letra/' not in href:
                    results.append({'title': a.get_text(strip=True), 'url': href})
            return results
        except: return []

    def search_bing(self, term):
        try:
            url = f"https://www.bing.com/search?q={urllib.parse.quote(term)}"
            resp = requests.get(url, headers=self.get_browser_headers(), timeout=10)
            soup = BeautifulSoup(resp.text, 'html.parser')
            results = []
            for li in soup.find_all('li', class_='b_algo'):
                h2 = li.find('h2')
                if h2 and h2.find('a'):
                    link = h2.find('a')
                    href = link.get('href')
                    if 'cifraclub.com.br' in href and '/letra/' not in href:
                        results.append({'title': link.get_text(strip=True), 'url': href})
            return results
        except: return []

    def show_selection_window(self, results):
        unique = []
        seen = set()
        for r in results:
            if r['url'] not in seen:
                unique.append(r)
                seen.add(r['url'])
        
        results = unique[:10]

        if not results:
            self.update_status("Nenhum resultado encontrado. Tente novamente.")
            messagebox.showinfo("Nada Encontrado", "Nenhum motor retornou resultados válidos.")
            return

        top = tk.Toplevel(self.root)
        top.title("Selecione a versão")
        top.geometry("600x450")
        top.configure(bg=self.colors["bg"])
        top.transient(self.root)
        top.grab_set()

        tk.Label(top, text=f"Encontrei {len(results)} resultados:", bg=self.colors["bg"], fg="white", font=("Segoe UI", 12, "bold")).pack(pady=10)

        list_frame = ttk.Frame(top)
        list_frame.pack(fill=tk.BOTH, expand=True, padx=15, pady=5)

        scrollbar = ttk.Scrollbar(list_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        listbox = tk.Listbox(
            list_frame, yscrollcommand=scrollbar.set,
            bg=self.colors["input_bg"], fg="white", font=("Segoe UI", 11),
            selectbackground=self.colors["accent"], borderwidth=0, highlightthickness=0,
            height=10
        )
        listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.config(command=listbox.yview)

        for item in results:
            clean_title = item['title'].replace(' | Cifra Club', '').replace(' - Cifra Club', '')
            listbox.insert(tk.END, f"🎵 {clean_title}")

        def confirm(event=None):
            idx = listbox.curselection()
            if idx:
                url = results[idx[0]]['url']
                top.destroy()
                self.process_url(url)

        tk.Button(top, text="Confirmar", command=confirm, bg=self.colors["success"], fg="white", font=("Segoe UI", 10, "bold"), pady=8).pack(fill=tk.X, padx=15, pady=15)
        listbox.bind('<Double-Button-1>', confirm)
        listbox.bind('<Return>', confirm)
        
        self.update_status(f"Escolha uma opção na janela.")

    # --- DOWNLOADER ---

    def process_url(self, url):
        threading.Thread(target=self._download_thread, args=(url,), daemon=True).start()

    def _download_thread(self, url):
        self.update_status("Conectando ao CifraClub...")
        
        target_url = url
        if self.simplify_var.get() and not 'simplificada.html' in target_url:
             target_url = target_url.rstrip('/') + '/simplificada.html'

        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            resp = requests.get(target_url, headers=headers, timeout=10)
            
            if resp.status_code == 404 and self.simplify_var.get():
                self.update_status("Versão simplificada indisponível. Baixando normal...")
                target_url = url.replace('/simplificada.html', '')
                resp = requests.get(target_url, headers=headers)
            
            resp.raise_for_status()
            
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            title = soup.find('h1', class_='t1').text.strip() if soup.find('h1', class_='t1') else "Desconhecido"
            artist = soup.find('h2', class_='t3').text.strip() if soup.find('h2', class_='t3') else "Desconhecido"
            
            key_span = soup.find('span', id='cifra_tom')
            tom = "N/A"
            if key_span:
                link = key_span.find('a')
                tom = link.text if link else key_span.text

            container = soup.find('pre')
            if not container: raise Exception("Container da cifra não encontrado.")

            content = "".join([re.sub(r'<[^>]+>', '', str(x)) for x in container.contents])
            content = self.clean_text(content)

            self.root.after(0, lambda: self.fill_ui(title, artist, tom, content))

        except Exception as e:
            self.root.after(0, lambda: messagebox.showerror("Erro", f"Falha ao baixar: {e}"))
            self.update_status("Erro.")

    def clean_text(self, text):
        lines = text.splitlines()
        out = []
        for line in lines:
            if re.search(r'^[eBGDAE]\|', line.strip()) or line.count('-') > 6:
                continue
            out.append(line)
        return re.sub(r'\n{3,}', '\n\n', "\n".join(out))

    def fill_ui(self, t, a, k, c):
        self.title_var.set(t)
        self.artist_var.set(a)
        self.key_var.set(k)
        self.text_area.delete(1.0, tk.END)
        self.text_area.insert(1.0, c)
        self.update_status(f"Carregado: {t}")

    def update_status(self, msg):
        self.root.after(0, lambda: self.status_var.set(msg))

    def save_file(self):
        content = self.text_area.get(1.0, tk.END).strip()
        if not content: return
        
        name = f"{self.artist_var.get()} - {self.title_var.get()}.json"
        name = re.sub(r'[<>:"/\\|?*]', '', name)
        
        path = filedialog.asksaveasfilename(
            defaultextension=".json", initialfile=name, filetypes=[("JSON", "*.json")]
        )
        
        if path:
            data = {
                "title": self.title_var.get(),
                "artist": self.artist_var.get(),
                "key": self.key_var.get(),
                "content": content
            }
            try:
                with open(path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                self.update_status("Arquivo salvo com sucesso!")
            except Exception as e:
                messagebox.showerror("Erro", str(e))

    def clear_all(self):
        self.url_entry.delete(0, tk.END)
        self.title_var.set("")
        self.artist_var.set("")
        self.key_var.set("")
        self.text_area.delete(1.0, tk.END)
        self.status_var.set("Limpo.")

if __name__ == "__main__":
    root = tk.Tk()
    try: root.iconbitmap(sys.executable) 
    except: pass
    app = FastChordScraper(root)
    root.mainloop()