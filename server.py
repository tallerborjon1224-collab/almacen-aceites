#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys
import webbrowser
import threading
import time
from pathlib import Path

PORT = 8080

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory='.', **kwargs)
    
    def log_message(self, format, *args):
        # Solo mostrar logs importantes
        if 'GET' in format or 'POST' in format:
            print(f'[{self.log_date_time_string()}] {format % args}')
    
    def end_headers(self):
        # Agregar headers para auto-recarga
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def start_server():
    try:
        with socketserver.TCPServer(('', PORT), CustomHandler) as httpd:
            print(f"🚀 Servidor iniciado en http://localhost:{PORT}")
            print(f"📁 Directorio: {os.getcwd()}")
            print(f"🔄 Auto-recarga activada")
            print(f"⏹️  Presiona Ctrl+C para detener")
            print("-" * 50)
            
            # Abrir navegador después de un segundo
            def open_browser():
                time.sleep(1)
                webbrowser.open(f'http://localhost:{PORT}')
            
            threading.Thread(target=open_browser, daemon=True).start()
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 10048:  # Address already in use
            print(f"❌ El puerto {PORT} ya está en uso")
            print("💡 Cierra otros servidores o usa un puerto diferente")
        else:
            print(f"❌ Error al iniciar servidor: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido")
        sys.exit(0)

if __name__ == "__main__":
    start_server()
