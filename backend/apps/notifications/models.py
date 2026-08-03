from django.db import models


class Notification(models.Model):
    recipient_id = models.IntegerField()
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"-> user {self.recipient_id}: {self.message[:40]}"
