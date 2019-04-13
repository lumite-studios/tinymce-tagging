# TinyMCE Tagging

A plugin to allow the use of tagging and mentions for TinyMCE.

Based on [https://github.com/StevenDevooght/tinyMCE-mention](https://github.com/StevenDevooght/tinyMCE-mention).

## Usage

Use as an external plugin when initialising TinyMCE.

```
tinymce.init({
	selector: "textarea#tagging",
	external_plugins: {
		'tag': 'https://crotanite.github.io/tinymce-tagging/plugin.js',
	},
	extended_valid_elements: 'span[class|id|data-mce-mentions-id]',
	tagging: {
		tags: [
			{
				delimeter: '@',
				insert: function(item, tag)
				{
					return '<span id="' + item.id + '">' + item.name + '</span>&nbsp;';
				},
				selector: 'name',
				source: [
					{ id: 1, name: 'Claude Harper' },
					{ id: 1, name: 'Alannah Carter' },
					{ id: 1, name: 'Felix Schultz' },
					{ id: 1, name: 'Holli Keenan' },
					{ id: 1, name: 'Aditi Berry' }
				],
			},
		],
	},
})
```