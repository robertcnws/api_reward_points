from django.http import HttpResponse
from django.shortcuts import render, get_object_or_404, redirect
from django.template.loader import get_template
from django.templatetags.static import static
from django.contrib.staticfiles import finders
from api_dealerportal.models import DealerportalQuote as Quote
from xhtml2pdf import pisa

def api_dealerportal_quote_render_pdf(request, quote_id, report_type="pdf"):
    template_path = f"api_dealerportal/quote_{report_type}.html"
    quote = Quote.objects(id=quote_id).first()
    if not quote:
        return HttpResponse("Quote not found", status=404)
    
    dealership = quote.owner

    quote_products = quote.get_products()

    context = {
        "quote": quote,
        "quote_products": quote_products,
        "dealership": dealership,
    }
    
    logo_path = finders.find("images/dealership.png")

    context["dealership_logo_url"] = logo_path
    
    response = HttpResponse(content_type="application/pdf")
    
    response["Content-Disposition"] = f'filename="report_{report_type}.pdf"'
    
    template = get_template(template_path)
    html = template.render(context)
    
    pisa_status = pisa.CreatePDF(html, dest=response)
    
    if pisa_status.err:
        return HttpResponse("We had some errors <pre>" + html + "</pre>")
    return response