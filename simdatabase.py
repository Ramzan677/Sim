import requests
import json
from flask import Flask, request, render_template

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        mobile = request.form.get('mobile')
        if mobile:
            try:
                url = f"https://tmphpscripts.xyz/Tajammal.php?num={mobile}"
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'}
                response = requests.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()
                return render_template('index.html', data=json.dumps(data, indent=4))
            except requests.exceptions.RequestException as e:
                return render_template('index.html', error=str(e))
        else:
            return render_template('index.html', error="Please enter a valid mobile number.")
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
