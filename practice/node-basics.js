const issue = {
    id: 101,
    title: 'Unable to access Wi-Fi',
    priority: 'High',
    status: 'Open'
};

const priorities = ['Low', 'Medium', 'High'];

function describeIssue(item) {
    return `${item.id}: ${item.title} [${item.priority}] - ${item.status}`;
}

console.log(describeIssue(issue));
console.log('Available priorities:', priorities);
console.log('JSON representation:');
console.log(JSON.stringify(issue, null, 2));
const issue2 = {
    id: 'ISS-200',
    title: 'Example',
    priority: 'Low'
};

const jsonText = JSON.stringify(issue2);
const objectAgain = JSON.parse(jsonText);

console.log(jsonText);
console.log(objectAgain.title);