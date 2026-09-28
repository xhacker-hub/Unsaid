# Turns `npx expo export --platform web` output into one self-contained page (dist/unsaid.html):
# JS inlined, the six fonts the app uses embedded as data URIs. Hosts that only serve a single
# file, or block same-origin scripts, can then run the prototype.
# Also writes dist/site/index.html, the same page as a full document, for GitHub Pages.
#   npx expo export --platform web && python3 scripts/web-page.py
import base64, glob, os, re

USED = ['FamiljenGrotesk_400Regular', 'FamiljenGrotesk_500Medium', 'FamiljenGrotesk_600SemiBold',
        'FamiljenGrotesk_700Bold', 'ShantellSans_400Regular', 'ShantellSans_500Medium']

js = open(glob.glob('dist/_expo/static/js/web/index-*.js')[0]).read()
for path in set(re.findall(r'"(/assets/node_modules/[^"]+\.ttf)"', js)):
    name = path.rsplit('/', 1)[1].split('.')[0]
    if name in USED:
        data = base64.b64encode(open('dist' + path, 'rb').read()).decode()
        js = js.replace(f'"{path}"', f'"data:font/ttf;base64,{data}"')
missing = [n for n in USED if f'/{n}.' in js]
assert not missing, f'fonts not embedded: {missing}'
js = js.replace('</script', '<\\/script')

page = f'''<title>Unsaid</title>
<style>
  :root {{ color-scheme: dark; --ground: #3A0C17; --line: #6B2437; box-sizing: border-box; }}
  html, body {{ height: 100%; }}
  body {{ margin: 0; overflow: hidden; background: var(--ground); }}
  /* A phone-width column: the prototype is a mobile app. */
  #root {{ display: flex; height: 100%; max-width: 480px; margin-inline: auto;
          border-inline: 1px solid var(--line); box-sizing: border-box; }}
  @media (max-width: 480px) {{ #root {{ border-inline: 0; }} }}
</style>
<noscript>Unsaid needs JavaScript to run.</noscript>
<div id="root"></div>
<script>{js}</script>
'''
open('dist/unsaid.html', 'w').write(page)  # fragment: the artifact host adds its own <head>

os.makedirs('dist/site', exist_ok=True)
open('dist/site/index.html', 'w').write(
    '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    '<meta name="theme-color" content="#3A0C17">\n'
    + page.replace('<noscript>', '</head>\n<body>\n<noscript>', 1) + '</body>\n</html>\n')
print(f'dist/unsaid.html + dist/site/index.html {len(page) / 1e6:.1f} MB')
