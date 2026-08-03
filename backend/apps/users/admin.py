from django.contrib import admin
from .models import User, Department, CustomRole, CompanyProfile

admin.site.register(User)
admin.site.register(Department)
admin.site.register(CustomRole)
admin.site.register(CompanyProfile)
