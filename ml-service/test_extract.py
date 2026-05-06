from audio_processor import VoiceEmotionModel

model = VoiceEmotionModel()
features = model.extract_features('temp_recording.webm')
print("Features:", features)
