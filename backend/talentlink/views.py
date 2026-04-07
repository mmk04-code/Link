from django.http import HttpResponse
from django.views import View

class IntroPageView(View):
    def get(self, request, *args, **kwargs):
        return HttpResponse("Welcome to Link API Intro Page")
