from django.db import models

from django.contrib.auth.models import User
# Create your models here.

class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    total = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id}"
    

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    size = models.CharField(max_length=50)
    price = models.IntegerField()
    qty = models.IntegerField()

    def subtotal(self):
        return self.price * self.qty
    



