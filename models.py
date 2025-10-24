import json
import os

class PomodoroHistory:
    def __init__(self, filepath='history.json'):
        self.filepath = filepath
        self._ensure_file()

    def _ensure_file(self):
        if not os.path.exists(self.filepath):
            with open(self.filepath, 'w') as f:
                json.dump([], f)

    def save(self, session):
        history = self.get_all()
        history.append(session)
        with open(self.filepath, 'w') as f:
            json.dump(history, f)

    def get_all(self):
        with open(self.filepath, 'r') as f:
            return json.load(f)
