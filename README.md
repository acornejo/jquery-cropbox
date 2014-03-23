# jquery-cropbox plugin.

jQuery plugin for in-place image cropping (zoom & pan, as opposed to select and drag).

This plugin depends only on jQuery. If either `Hammer.js` or `jquery.hammer.js` is
loaded, the cropbox plugin will support gestures for panning and zooming
the cropbox. Similary, if the `jquery.mousewheel.js` plugin is loaded, then the
cropbox plugin will support zoom in & out using the mousewheel. All
dependencies on third party libraries (other than jQuery) are strictly
optional. Support for CommonJS and AMD loading is built in.

In browsers that support the HTML5 FIle API and Canvas API, the cropbox
plugin provides mehtods to crop the image on the client and obtain the
resulting cropped image as a Data URL or a binary blob to upload it to
the server.

Check out the plugin in action here http://acornejo.github.io/jquery-cropbox/

**History:**
This plugin started as a fork of
[jQcrop](https://github.com/terebentina/jQcrop), and added touch
support, mousewheel support and client resize support through the canvas
api.

## Usage

```javascript
	$('yourimage').cropbox({
	    width: 200,
		height: 200
	}).on('cropbox', function(e, data) {
        console.log('crop window: ' + data);
	});
```
## Options

<table>
	<tr>
		<th>Option</th>
		<th>Type</th>
		<th>Default</th>
		<th>Required</th>
		<th>Description</th>
	</tr>
	<tr>
		<td>width</td>
		<td>integer</td>
		<td>200</td>
		<td>no</td>
		<td>Width in pixels of the cropping window</td>
	</tr>
	<tr>
		<td>height</td>
		<td>integer</td>
		<td>200</td>
		<td>no</td>
		<td>Height in pixels of the cropping window</td>
	</tr>
	<tr>
		<td>zoom</td>
		<td>integer</td>
		<td>10</td>
		<td>no</td>
		<td>Number of incremental zoom steps. With the default of 10, you have to click the zoom-in button 9 times to reach 100%.</td>
	</tr>
	<tr>
		<td>maxZoom</td>
		<td>number</td>
		<td>1.0</td>
		<td>no</td>
		<td>Maximum zoom value. With the default of 1.0 users can't zoom beyond the maximum image resolution.</td>
	</tr>
	<tr>
		<td>controls</td>
		<td>string/jquery</td>
		<td>null</td>
		<td>no</td>
		<td>If not null, this is the entire html block that should appear on hover over the image for instructions and/or buttons (could include the zoom in/out buttons for example). If null, the default html block is used which has the text "Click to drag" and the zoom in/out buttons. Use false to disable controls.</td>
	</tr>
    <tr>
        <td>result</td>
        <td>{cropX:number, cropY:number, cropW:number, cropH:number}</td>
        <td>null</td>
        <td>no</td>
        <td>Set the initial cropping area</td>
    </tr>
	<tr>
		<td>showControls</td>
		<td>never, always, hover, auto</td>
		<td>auto</td>
		<td>no</td>
		<td>This flag is used to determine when to display the controls. Never, always and hover do exactly what you would expect (never show them, always show them, show them on hover). The auto flag is the same as the hover flag, except that on mobile devices it always shows the controls (since there is no hover event).</td>
	</tr>
</table>

## Methods

<table>
	<tr>
		<th>Name</th>
		<th>Parameters</th>
		<th>Description</th>
	</tr>
	<tr>
		<td>zoomIn</td>
		<td>(none)</td>
		<td>Increase image zoom level by one step</td>
	</tr>
	<tr>
		<td>zoomOut</td>
		<td>(none)</td>
		<td>Decrease image zoom level by one step</td>
	</tr>
	<tr>
		<td>zoom</td>
		<td>percent</td>
		<td>Set zoom leevl to a value between 0 and 1. Need to call
        update to reflect the changes.</td>
	</tr>
	<tr>
		<td>drag</td>
		<td>{startX: integer, startY: integer, dx: integer, dy: integer}</td>
		<td>Simulate image dragging, starting from (startX,startY) and moving a delta of (dx,dy). Need to call update to reflect the changes.</td>
	</tr>
    <tr>
        <td>setCrop</td>
        <td>{cropX: number, cropY: number, cropW: number, cropH: number}</td>
        <td>Set crop window.</td>
    </tr>
	<tr>
		<td>update</td>
		<td>(none)</td>
		<td>Update the cropped result (must call after zoom and drag).</td>
	</tr>
	<tr>
		<td>getDataURL</td>
		<td>(none)</td>
		<td>Generate a URL for the cropped image on the client (requires HTML5 compliant browser).</td>
	</tr>
	<tr>
		<td>getBlob</td>
		<td>(none)</td>
		<td>Generate a Blob with the cropped image (requires HTML5 compliant browser).</td>
	</tr>
	<tr>
		<td>remove</td>
		<td>(none)</td>
		<td>Remove the cropbox functionality from the image.</td>
	</tr>
</table>

## Event

To get the crop results, bind a function on the `cropbox` event or read the object's result property .

```javascript
    $('yourimage').cropbox({width: 250, height: 250})
    .on('cropbox', function (e, result) {
        console.log(result);
    });
```

A reference to the cropbox object can be accessed like so:
```javascript
	var crop = $('yourimage').data('cropbox');
	console.log(crop.result);
```

You then have access to all the properties and methods used for that specific element.
