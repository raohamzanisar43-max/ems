from django.db import models


class Conversation(models.Model):
    """A thread tied to a task/project between an employee and their team lead/CEO."""
    task_id = models.IntegerField(null=True, blank=True)
    participant_ids = models.JSONField(help_text="List of user IDs in this conversation, e.g. [12, 7]")
    department_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Conversation #{self.id} (task {self.task_id})"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender_id = models.IntegerField()
    sender_username = models.CharField(max_length=150)
    text = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["sent_at"]

    def __str__(self):
        return f"{self.sender_username}: {self.text[:30]}"
