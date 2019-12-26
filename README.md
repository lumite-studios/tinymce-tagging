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
	extended_valid_elements: 'span[class|id|data-tagging-id]',
	tagging: {
		tags: [
			{
				delimeter: '@',
				insert: function(item, tag)
				{
					return '<span id="' + item.id + '">' + item.name + '</span>&nbsp;';
				},
				selector: 'name',
				source(query, success)
				{
					const users = tagSearchFunction(query)
					success(users)
				},
			},
		],
	},
})
```