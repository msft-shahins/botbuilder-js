const Table = require('cli-table2');
const chalk = require('chalk');

const manifest = require('./api/manifest');
const {getServiceManifest, getCategoryManifest, getNamedArgsMap} = require('./utils/argsUtil');

/**
 * Displays help content from the arguments.
 *
 * @param args The arguments input by the user
 * @returns {Promise<void>}
 */
module.exports = async function help(args) {
    const helpContents = await getHelpContents(args);
    let x = 'getWindowSize' in process.stdout ? process.stdout.getWindowSize()[0] : 50;
    process.stdout.write('\nLUIS cli for interacting with the LUIS api - © 2018 Microsoft Corporation\n\n');
    process.stdout.write(chalk.bold(`usage: luis ${chalk.cyan('<api group> <action> [<target> [<subtarget>] [--<args> --<globalArgs>]]]')}\n\n`));
    helpContents.forEach(helpContent => {
        const rows = helpContent.table[0].length;
        let i = rows - 1;
        const colWidthsFor2On = ((x * .85) - 22) / i;
        const colWidths = [22];

        while (i--) {
            colWidths.push(~~colWidthsFor2On);
        }

        const table = new Table({
            colWidths,
            style: {'padding-left': 1, 'padding-right': 1},
            wordWrap: true
        });
        table.push(...helpContent.table);
        process.stdout.write(helpContent.head + '\n');
        process.stdout.write(table.toString());
        process.stdout.write('\n\n');
    });
};

/**
 * Retrieves help content vie the manifest.json from
 * the arguments input by the user.
 *
 * @param args The arguments input by the user
 * @returns {Promise<*>}
 */
async function getHelpContents(args) {
    if ('!' in args) {
        return getAllCommands();
    }

    const category = getCategoryManifest(args);
    const {apiGroup: categoryName, target, subTarget} = getNamedArgsMap(args);

    const serviceManifest = getServiceManifest(args, true);
    if (serviceManifest) {
        const targetHelpContents = getHelpContentsForTargetOrSubTarget(serviceManifest, categoryName, target, subTarget);
        return !target ? targetHelpContents.concat(getHelpContentsForCategory(category, categoryName)) : targetHelpContents;
    }

    if (category) {
        const helpContentsForCategory = getHelpContentsForCategory(category, categoryName);
        if (target) {
            helpContentsForCategory[0].head = `${chalk.cyan.bold(target)} does not exist. Did you mean one of these?`;
        }
        return helpContentsForCategory;
    }

    return getGeneralHelpContents();
}

/**
 * General help contents
 *
 * @returns {*[]}
 */
function getGeneralHelpContents() {
    return [
        {
            // These could not be derived from the manifest because
            // no descriptions exist in the swagger.json is was created from.
            head: chalk.bold(` Where ${chalk.cyan('<api group>')} is one of the following:`),
            table: [
                ['apps', 'Adding, listing, exporting, publishing and updating LUIS apps'],
                ['examples', 'Adding, removing and updating labeled examples to the app'],
                ['features', 'Adding, removing, and updating pattern and phraselist feature info'],
                ['models', 'Interacting with LUIS models'],
                ['permissions', 'Interacting with access lists'],
                ['train', 'Retrieving training status or training the configured app version'],
                ['versions', 'Assigning, cloning, deleting, importing and exporting app versions'],
                ['', chalk.bold(`Use ${chalk.cyan('luis <api group> --help')} for details on a specific api group`)]
            ]
        },
        {
            head: chalk.bold(` Where ${chalk.cyan('<action>')} is one of the following:`),
            table: [
                ['get,    g', 'Retrieves or reads the specified <target> or <subtarget> where applicable'],
                ['create, c', 'Creates a new resource at the <target> or <subtarget> where applicable'],
                ['list,   l', `Retrieves a list of <target> or <subtarget> ${chalk.cyan.bold('--skip')} and ${chalk.cyan.bold('--take')} pagination arguments are optional`],
                ['update, u', 'Updates an existing resource at <target> or <subtarget> where applicable'],
                ['patch,  p', 'Updates a partial resource at <target> or <subtarget> where applicable'],
                ['delete, d', 'Deletes a resource at <target> or <subtarget> where applicable']
            ]
        },
        {
            head: 'Arguments:',
            table: [
                ['--appId', 'Specifies the application id. This can optionally be specified in the .luisrc'],
                ['--versionId', 'Specifies the version id. This can optionally be specified in the .luisrc'],
                ['--in <path>', 'Specifies the input file path. Applicable for create, update and patch actions'],
                ['--skip <int>', 'Specifies the number of records to skip. Applicable for the list action only'],
                ['--take <int>', 'Specifies the number of records to take. Applicable for the list action only'],
            ]
        },
        {
            head: 'Global Arguments:',
            table: [
                ['--help,    -h', `Prints this help file. Use ${chalk.cyan.bold('<api group> [<target>] -h')} to see specific details on an <api group>`],
                ['--!          ', 'Dumps absolutely all documented commands to the console with descriptions'],
                ['--init,    -i', 'Initializes the .luisrc file with settings specific to your LUIS instance'],
                ['--version, -v', 'Prints the version of this cli tool']
            ]
        },
    ];
}

/**
 * Walks the manifest.json and pulls out all
 * commands that are supported.
 *
 * @returns {*[]}
 */
function getAllCommands() {
    const table = [];
    Object.keys(manifest).forEach(key => {
        const {[key]: category} = manifest;
        Object.keys(category).forEach(categoryKey => {
            const {operations} = category[categoryKey];
            operations.forEach((operation, index) => {
                table.push([index ? '' : chalk.cyan.bold(categoryKey), chalk.cyan.bold(operation.command), operation.description]);
            });
        });
    });
    return [
        {
            head: chalk.cyan.bold('All documented commands:'),
            table
        }
    ];
}

/**
 * Gets the help content for a target or sub target.
 *
 * @param {*} serviceManifest The manifest entry containing the operations
 * @param {string} categoryName The name of the category it belongs to
 * @param {string} targetName The name of the target (if present)
 * @param {string} subTargetName the name of the subTarget (if present)
 *
 * @returns {Array}
 */
function getHelpContentsForTargetOrSubTarget(serviceManifest, categoryName, targetName, subTargetName) {
    const {operation} = serviceManifest;
    const operations = serviceManifest.operation ? [operation] : serviceManifest.operations;

    let targets = operations.slice().filter(operation => !subTargetName && !operation.subTarget);
    let subTargets = operations.slice().filter(operation => subTargetName ? operation.subTarget === subTargetName : !!operation.subTarget);

    // Display the subtargets like the targets
    // if we are specifying help for a subtarget.
    if (subTargetName) {
        targets = subTargets;
        subTargets = [];
    }
    const payload = [];
    if (targets.length) {
        payload.push({
            head: chalk.bold(`Where ${chalk.cyan('<action>')} is one of the following:`),
            table: targets.map(getHelpForOperation)
        });
    }

    // params table is shown only if we have a single
    // operation with 1 or more params.
    if (serviceManifest.operation && serviceManifest.operation.params) {
        const {operation} = serviceManifest;
        const {params} = operation;
        const paramsHelp = {
            head: chalk.bold(`Where ${chalk.cyan('--<args>')} is one or more of the following:`),
            table: params.map(param => [`--${param.name} <${param.type}>${param.required ? ' (required)' : ''}`, param.description])
        };
        if (operation.entityName) {
            paramsHelp.table.unshift(['--in (required)', `The ${operation.entityType} object to send in the body of the request`]);
        }
        payload.push(paramsHelp);
    }

    if (subTargets.length) {
        payload.push(getHelpForSubTargets(subTargets, categoryName, targetName));
    }
    return payload;
}

/**
 * Gets the help content for a named category, a.k.a. <api group>
 *
 * @param {*} category The category containing the manifests for each target within it.
 * @param {string} categoryName The name of the category
 *
 * @returns {*[]}
 */
function getHelpContentsForCategory(category, categoryName) {
    return [{
        head: chalk.bold(`Where ${chalk.cyan('<target>')} may be one of the following:`),
        table: [
            [chalk.cyan.bold(`luis ${categoryName} <action> <target>`), Object.keys(category).filter(key => key !== categoryName).join(', ')],
            ['', chalk.bold(`Use ${chalk.cyan(`luis ${categoryName} <target> --help`)} for details on a specific target`)]
        ]
    }];
}

/**
 * Gets the help content for the named <subtarget>
 *
 * @param {{}[]} operations An array of operations that contain the named subtarget
 * @param {string} categoryName The name of the category owning the subtarget
 * @param {string} targetName The name of the target owning the subtarget
 *
 * @returns {{head: *|string, table: *[]}}
 */
function getHelpForSubTargets(operations, categoryName, targetName) {
    return {
        head: chalk.bold(`Where ${chalk.cyan('<subtarget>')} may be one of the following:`),
        table: [
            [chalk.cyan.bold(`luis ${categoryName} <action> ${targetName} <subtarget>`), operations.map(operation => operation.subTarget).join(', ')],
            ['', chalk.bold(`Use ${chalk.cyan(`luis ${categoryName} <action> ${targetName} <subtarget> --help`)} for details on a specific subtarget`)]
        ]
    };
}

/**
 * Gets the help content for an operation
 *
 * @param {*} operation The operation to display the help contents for
 *
 * @returns {*[]}
 */
function getHelpForOperation(operation) {
    const {methodAlias, command, description} = operation;
    return [methodAlias, `${description} \nexample: ${chalk.cyan.bold(command)}`];
}