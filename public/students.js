// No need to put this script at the end of the file,
// because it waits for the DOM to be loaded in any case
document.addEventListener("DOMContentLoaded", function (event) {
  // Create <a href="/students/create">Create student</a>
  // using JavaScript and the DOM API
  // (the element is not yet inserted into DOM)
  const createLink = document.createElement("a");
  createLink.setAttribute("href", "/students/create");
  createLink.textContent = "Create student";
  // Display this new element after the student list
  const studentsList = document.querySelector("ul.students");
  studentsList.append(createLink);
  // Add a test button
  const testButton = document.querySelector("button#test");
  testButton.addEventListener("click", function (event) {
    alert("CLICKED!");
  });
});
