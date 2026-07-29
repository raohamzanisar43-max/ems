from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Payslip
from .serializers import PayslipSerializer
from .permissions import IsFinanceOrHR


class PayslipViewSet(viewsets.ModelViewSet):
    """
    - Finance/HR: full access, can generate payslips for any employee.
    - Everyone else: can only ever see their OWN payslips. No exceptions -
      not even CEO/CTO/Team Lead can see another employee's salary here.
    """
    serializer_class = PayslipSerializer
    permission_classes = [permissions.IsAuthenticated, IsFinanceOrHR]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin or user.is_finance or user.is_hr:
            return Payslip.objects.all()
        return Payslip.objects.filter(employee_id=user.id)

    def perform_create(self, serializer):
        serializer.save(generated_by_id=self.request.user.id)

    @action(detail=False, methods=["get"])
    def my_payslips(self, request):
        qs = Payslip.objects.filter(employee_id=request.user.id)
        return Response(PayslipSerializer(qs, many=True).data)
