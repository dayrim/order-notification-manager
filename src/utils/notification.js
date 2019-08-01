export function toErrorNotification (notification, message, time = 2.5) {
  notification
    .setError()
    .setMessage(message)

  if (time) {
    notification.delayedClose(time)
  }

  return notification
}
