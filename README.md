# TinyMCE Tagging

A plugin to allow the use of tagging and mentions for TinyMCE.

## Usage

Use as an external plugin when initialising TinyMCE.

```
tinymce.init({
	selector: "textarea#tagging",
	external_plugins: {
		'tag': 'https://crotanite.github.io/tinymce-tagging/plugin.js',
	},
	tagging: {
		delay: 500,
		tags: {
			hash: {
				delimeter: '#',
				selector: 'hashtag',
				source: [
					{ hashtag: 'general' },
					{ hashtag: 'news' },
				],
			},
			users: {
				delimeter: '@',
				selector: 'name',
				source: function(query, success)
				{
					fetch('/').then(res => res.json()).then(out =>
					{
						success(out.data);
					});
				},
			}
		},
	},
})
```