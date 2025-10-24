import unittest
from pomodoro import PomodoroTimer

from models import PomodoroHistory
import os

class TestPomodoroHistory(unittest.TestCase):
	def setUp(self):
		self.test_file = 'test_history.json'
		# テスト用ファイルを毎回初期化
		if os.path.exists(self.test_file):
			os.remove(self.test_file)
		self.history = PomodoroHistory(filepath=self.test_file)

	def tearDown(self):
		if os.path.exists(self.test_file):
			os.remove(self.test_file)

	def test_save_and_get(self):
		session = {'start': '2025-10-24T10:00:00', 'end': '2025-10-24T10:25:00', 'type': 'work'}
		self.history.save(session)
		all_history = self.history.get_all()
		self.assertEqual(len(all_history), 1)
		self.assertEqual(all_history[0]['type'], 'work')

class TestPomodoroTimer(unittest.TestCase):
	def test_start(self):
		timer = PomodoroTimer()
		self.assertFalse(timer.running)
		timer.start()
		self.assertTrue(timer.running)

	def test_stop(self):
		timer = PomodoroTimer()
		timer.start()
		timer.stop()
		self.assertFalse(timer.running)

	def test_reset(self):
		timer = PomodoroTimer()
		timer.start()
		timer.reset()
		self.assertFalse(timer.running)
		self.assertEqual(timer.remaining, timer.duration)

if __name__ == "__main__":
	unittest.main()


import app
class TestAPI(unittest.TestCase):
	def setUp(self):
		app.app.config['TESTING'] = True
		self.client = app.app.test_client()

	def test_start_api(self):
		res = self.client.post('/api/start')
		self.assertEqual(res.status_code, 200)
		self.assertIn('started', res.get_json()['status'])

	def test_stop_api(self):
		res = self.client.post('/api/stop')
		self.assertEqual(res.status_code, 200)
		self.assertIn('stopped', res.get_json()['status'])

	def test_status_api(self):
		res = self.client.get('/api/status')
		self.assertEqual(res.status_code, 200)
		self.assertIn('running', res.get_json())

	def test_history_api(self):
		# POST履歴
		session = {'start': '2025-10-24T10:00:00', 'end': '2025-10-24T10:25:00', 'type': 'work'}
		res = self.client.post('/api/history', json=session)
		self.assertEqual(res.status_code, 200)
		self.assertEqual(res.get_json()['result'], 'saved')
		# GET履歴
		res = self.client.get('/api/history')
		self.assertEqual(res.status_code, 200)
		self.assertTrue(isinstance(res.get_json(), list))
