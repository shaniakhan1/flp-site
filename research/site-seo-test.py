"""Static discovery regressions. Run: python3 research/site-seo-test.py."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote
import base64
import hashlib
import json
import re
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
ORIGIN = 'https://flpmarketinggroup.com'


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path, self.text = path, path.read_text()
        self.links, self.ids, self.meta, self.canonicals = [], set(), {}, []
        self.h1_count = 0
        self.feed(self.text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            self.ids.add(a['id'])
        if tag == 'a' and 'href' in a:
            self.links.append(a['href'])
        if tag == 'meta':
            self.meta[a.get('name', a.get('http-equiv', a.get('property')))] = a.get('content', '')
        if tag == 'link' and a.get('rel') == 'canonical':
            self.canonicals.append(a['href'])
        if tag == 'h1':
            self.h1_count += 1


PAGES = {p: Page(p) for p in ROOT.rglob('*.html')
         if p.relative_to(ROOT).parts[0] not in ('research', 'qa')}


class DiscoveryTests(unittest.TestCase):
    def test_public_review_excerpts_have_attribution(self):
        home = (ROOT / 'index.html').read_text()
        self.assertIn('id="reviews"', home)
        for name in ['Dharshini Casinathen', 'Lea Hamadeh', 'Chelsea Edwards']:
            self.assertIn(name, home)
        self.assertIn('Google review excerpt', home)
        self.assertIn('Selected excerpts, checked November 9, 2026', home)
        self.assertIn('query_place_id=ChIJxexs5GPNQIYRvstzf0ehVcA', home)
        self.assertIn('Television reporter', home)
        self.assertNotIn('aggregateRating', home)

    def test_page_basics_and_unique_titles(self):
        titles = []
        for page in PAGES.values():
            with self.subTest(page=page.path.relative_to(ROOT)):
                self.assertEqual(page.h1_count, 1)
                self.assertTrue(page.meta.get('description'))
                self.assertEqual(len(page.canonicals), 1)
                self.assertTrue(page.canonicals[0].startswith(ORIGIN + '/'))
                title = re.search(r'<title>(.*?)</title>', page.text, re.S)
                self.assertIsNotNone(title)
                titles.append(title[1])
        self.assertEqual(len(titles), len(set(titles)))

    def test_local_links_and_fragments(self):
        for page in PAGES.values():
            for href in page.links:
                url = urlparse(href)
                if url.scheme or url.netloc:
                    continue
                with self.subTest(page=page.path.relative_to(ROOT), href=href):
                    target = ROOT / url.path.lstrip('/') if url.path.startswith('/') else page.path.parent / url.path
                    if not url.path:
                        target = page.path
                    if target.is_dir():
                        target /= 'index.html'
                    target = target.resolve()
                    self.assertTrue(target.exists(), str(target))
                    if url.fragment and target in PAGES:
                        self.assertIn(unquote(url.fragment), PAGES[target].ids)

    def test_valid_json_ld_and_matching_csp_hashes(self):
        for page in PAGES.values():
            for script in re.findall(r'<script\b[^>]*>(.*?)</script>', page.text, re.S):
                if not script.strip():
                    continue
                with self.subTest(page=page.path.relative_to(ROOT)):
                    json.loads(script)
                    digest = base64.b64encode(hashlib.sha256(script.encode()).digest()).decode()
                    self.assertIn("'sha256-" + digest + "'", page.meta['Content-Security-Policy'])

    def test_consistent_agency_entity(self):
        organizations = []
        for page in PAGES.values():
            for script in re.findall(r'<script type="application/ld\+json">(.*?)</script>', page.text, re.S):
                for entity in json.loads(script).get('@graph', []):
                    if entity.get('@id') == ORIGIN + '/#organization' and entity.get('@type') == 'Organization':
                        organizations.append(entity)
        self.assertGreater(len(organizations), 10)
        for entity in organizations:
            self.assertEqual(entity, organizations[0])
            self.assertIn('For The Love Of People Group', entity['alternateName'])
            self.assertEqual(entity['foundingDate'], '2018')
            self.assertNotIn('aggregateRating', entity)
            self.assertNotIn('review', entity)

    def test_sitemap_points_only_to_indexable_canonical_pages(self):
        urls = ET.parse(ROOT / 'sitemap.xml').findall('{*}url')
        locs = [url.find('{*}loc').text for url in urls]
        self.assertEqual(len(locs), len(set(locs)))
        self.assertIn(ORIGIN + '/about/', locs)
        for loc in locs:
            path = ROOT / urlparse(loc).path.lstrip('/') / 'index.html'
            with self.subTest(url=loc):
                self.assertIn(path, PAGES)
                self.assertEqual(PAGES[path].canonicals, [loc])
                self.assertNotIn('noindex', PAGES[path].meta.get('robots', ''))

    def test_social_service_contains_scoped_work_examples(self):
        page = PAGES[ROOT / 'social-media-management/index.html']
        self.assertIn('<h1>Social media management in Houston.</h1>', page.text)
        self.assertIn('/work/joyleaf/', page.links)
        self.assertIn('/work/dharsh/', page.links)
        self.assertIn('/working-together/', page.links)
        self.assertIn('JOYLEAF · ROSELLE, NEW JERSEY', page.text)
        self.assertIn('artwork shown here is historical', page.text)
        self.assertIn('starts at $4,000/month', page.text)
        self.assertIn('Original filming and travel require a separate production scope', page.text)
        self.assertIn('They do not claim measured follower growth, leads, or sales', page.text)
        self.assertEqual(len(re.findall(r'<img\b', page.text)), 2)
        for src, width, height in re.findall(r'<img[^>]+src="([^"]+)"[^>]+width="(\d+)"[^>]+height="(\d+)"', page.text):
            self.assertTrue((ROOT / src.lstrip('/')).is_file())
            self.assertGreater(int(width), 0)
            self.assertGreater(int(height), 0)

    def test_about_is_linked_and_factually_bounded(self):
        home = PAGES[ROOT / 'index.html']
        about = PAGES[ROOT / 'about/index.html']
        self.assertIn('/about/', home.links)
        self.assertIn('marketing and public relations agency', about.text)
        self.assertIn('2018', about.text)
        self.assertIn('do not claim unmeasured sales', about.text)
        self.assertNotRegex(about.text.lower(), r'number.one|top.rated|best agency|guaranteed')


if __name__ == '__main__':
    unittest.main(verbosity=2)
