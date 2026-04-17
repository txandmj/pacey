const mapToCommonTerms = require('./keymap');
const parse_document = require('./parser');

// Helper function for processing images
async function textToJSON(filepath) {
    const text = await parse_document(filepath);
    const parsedJson = mapToCommonTerms(text);
  
    const data = {
      'pacemaker_dependent': (parsedJson["implant"] && parsedJson["implant"].length > 0) ? parsedJson["implant"][0] : 10000,
      'incision_location': 'TBD',
      'pacemaker_manufacturer': (parsedJson['device'] && parsedJson["device"].join('').trim().length == 0) ? 'unknown' : parsedJson["device"].join(','),
      'magnet_response': (parsedJson["battery"][0] && parsedJson["battery"][0].length >= 1) ? "ON" : "OFF",
      'impedance': (parsedJson['impedance'] && parsedJson['impedance'].length == 0) ? 'unknown' : parsedJson["impedance"].join(',')
    }
  
    return data;
}

if (require.main === module) {
  const IMG_PATH = "./boston.png";
  (async () => {
    const text = await textToJSON(IMG_PATH);
    console.log('Recognized text:', JSON.stringify(text));
  })();
}

module.exports = textToJSON;
