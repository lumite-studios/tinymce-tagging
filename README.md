# TinyMCE Tagging

A plugin to allow the use of tagging and mentions for TinyMCE.

Based on [https://github.com/StevenDevooght/tinyMCE-mention](https://github.com/StevenDevooght/tinyMCE-mention).

## Usage

Use as an external plugin when initialising TinyMCE.

### Init

```
tinymce.init({
	selector: "textarea#tagging",
	external_plugins: {
		'tag': 'https://crotanite.github.io/tinymce-tagging/plugin.js',
	},
	extended_valid_elements: 'span[class|id|data-tagging-id]',
	tagging: [
		{
			delimeter: '@',
			insert(item)
			{
				return '<span id="' + item.id + '">' + item.name + '</span>&nbsp;';
			},
			selector: 'name',
			source(query, success)
			{
				const users = tagSearchFunction(query)
				// users = [{ id: 1, name: 'user' }, { id: 2, name: 'test' }]
				success(users)
			},
		},
	],
})
```

### Options
* delimeter: The character used to initialise the tagging.
* insert: A function that should return a string which will display the tag within the tinymce editor.
* selector: The object parameter to search for.
* source: The function that handles searching.
* title (optional): The title to display within the list. Defaults to the selector.
* loadingMessage (optional): String that shows when results are loading. Defaults to 'Loading...'.
* emptyMessage (optional): String that shows if there are no results. Defaults to 'There are no results.'.