class PomodoroTimer:
	def __init__(self, duration=1500):
		self.duration = duration  # 秒（25分）
		self.remaining = duration
		self.running = False

	def start(self):
		self.running = True

	def stop(self):
		self.running = False

	def reset(self):
		self.running = False
		self.remaining = self.duration
