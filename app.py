from flask import Flask, render_template

from flask import request, jsonify
from pomodoro import PomodoroTimer
from models import PomodoroHistory
import datetime

timer = PomodoroTimer()
history = PomodoroHistory()

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')


# タイマー開始
@app.route('/api/start', methods=['POST'])
def api_start():
    timer.start()
    return jsonify({'status': 'started'})

# タイマー停止
@app.route('/api/stop', methods=['POST'])
def api_stop():
    timer.stop()
    return jsonify({'status': 'stopped'})

# タイマー状態取得
@app.route('/api/status', methods=['GET'])
def api_status():
    return jsonify({
        'running': timer.running,
        'remaining': timer.remaining,
        'duration': timer.duration
    })

# 履歴取得・保存
@app.route('/api/history', methods=['GET', 'POST'])
def api_history():
    if request.method == 'POST':
        session = request.json
        history.save(session)
        return jsonify({'result': 'saved'})
    else:
        return jsonify(history.get_all())

if __name__ == '__main__':
    app.run(debug=True)
