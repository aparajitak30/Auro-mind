import av
container = av.open('temp_recording.webm')
stream = container.streams.audio[0]
frame = next(container.decode(stream))
arr = frame.to_ndarray()
print("Array shape:", arr.shape)
print("Array type:", arr.dtype)
