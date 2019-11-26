const functions = require('firebase-functions');
const cowsay = require('cowsay');
const minimist = require('minimist');


const help = `Usage: /cowsay [-a action] [-e eye_string] [-f cowfile] [-h] [-l] [-n] [-T tongue_string] [-W column] [-bdgpstwy] -- text

Options:

  -a  Action: Either talk or say. Default is talk.
  -b  Mode: Borg
  -d  Mode: Dead
  -g  Mode: Greedy
  -p  Mode: Paranoia
  -s  Mode: Stoned
  -t  Mode: Tired
  -w  Mode: Wired
  -y  Mode: Youthful
  -e  Select the appearance of the cow's eyes.                                                                                                      [default: "oo"]
  -T  The tongue is configurable similarly to the eyes through -T and tongue_string.                                                                [default: "  "]
  -h  Display this help message
  -n  If it is specified, the given message will not be word-wrapped.
  -W  Specifies roughly where the message should be wrapped. The default is equivalent to -W 40 i.e. wrap words at or before the 40th column.       [default: 40]
  -f  Specifies a cow picture file (''cowfile'') to use. It can be either a path to a cow file or the name of one of cows included in the package.  [default: "default"]
  -r  Select a random cow
  -l  List all cowfiles included in this package.`;


// Adds invisible char after backquotes to prevent closing wrapping code block
const wrap = exports.wrap = str => `\`\`\`
${str.replace(/`/g, '`‎')}
\`\`\``;


exports.cowsay = functions.https.onRequest((req, resp) => {
  if (req.url !== '/' || req.method !== 'POST') {
    return resp.status(404).send('Not found');
  }

  const parsed = minimist(req.body.text.split(/\s/));
  const args = parsed._;
  const action = parsed.a || parsed.action || 'say';
  const opts = Object.keys(parsed).reduce(
    (memo, key) => (
      (key === '_' || key === 'a' || key === 'action')
        ? memo
        : Object.assign(memo, { [key]: parsed[key] })
    ),
    {},
  );

  if (typeof cowsay[action] !== 'function') {
    return resp.status(400).send('Unknown action');
  }

  if (opts.h || opts.help) {
    return resp.send(help);
  }

  if (opts.l) {
    return cowsay.list((err, data) => {
      if (err) {
        return resp.status(500).send('Error reading list');
      }
      resp.send(data.join(' '));
    });
  }

  return resp.json({
    response_type: 'in_channel',
    text: wrap(cowsay[action](Object.assign(opts, { text : args.join(' ') }))),
  });
});
