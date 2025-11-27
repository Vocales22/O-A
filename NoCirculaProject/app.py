from flask import Flask, render_template, jsonify
import requests
import json
import os

app = Flask(__name__)

# ==========================================
# RUTAS DE VISTAS
# ==========================================
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

# ==========================================
# RUTA API (BACKEND)
# ==========================================
@app.route('/api/usuarios')
def get_usuarios():
    # URL DE TU API EN AWS
    AWS_URL = "https://r9h2peddkg.execute-api.us-east-2.amazonaws.com/main"
    
    print("-" * 50)
    print("📡 CONECTANDO CON AWS...") 

    try:
        response = requests.get(AWS_URL, timeout=3) # Timeout de 3 seg
        
        if response.status_code == 200:
            datos = response.json()
            cantidad = len(datos)
            print(f"✅ CONEXIÓN EXITOSA: Se descargaron {cantidad} usuarios de la nube.")
            print("-" * 50)
            return jsonify(datos)
        else:
            print(f"⚠️ AWS respondió con error: {response.status_code}")
            raise Exception("Error de estado AWS")

    except Exception as e:
        print(f"❌ FALLO DE CONEXIÓN: {e}")
        print("📂 Activando Protocolo de Emergencia: Base de Datos Local.")
        
        ruta_json = os.path.join(app.root_path, 'usuarios.json')
        try:
            with open(ruta_json, 'r', encoding='utf-8') as f:
                local_data = json.load(f)
                print(f"✅ RESPALDO CARGADO: {len(local_data)} usuarios locales disponibles.")
                print("-" * 50)
                return jsonify(local_data)
        except:
            return jsonify([])

if __name__ == '__main__':
    app.run(debug=True, port=5000)