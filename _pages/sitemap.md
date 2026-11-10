---
title: "Sitemap"
permalink: /sitemap/
---

All pages of this site. There is also an [XML version]({{ '/sitemap.xml' | relative_url }}) for search engines.

{% assign pages = site.pages | where_exp: "p", "p.title" | where_exp: "p", "p.sitemap != false" | sort: "title" %}
{% for p in pages %}{% unless p.url contains '.xml' or p.url contains '.css' %}
* [{{ p.title }}]({{ p.url | relative_url }}){% endunless %}{% endfor %}
