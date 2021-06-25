document.addEventListener("DOMContentLoaded", function () {
  d3.select("body").style("background-color", "#e0f0f5");
  d3.csv("/covid-19-students-delhi.csv").then(function (data) {
    console.log(data);
    let stressBusterCount = {};
    data.forEach((row) => {
      const stressBuster = row["Stress busters"];
      if (!stressBusterCount[stressBuster]) {
        stressBusterCount[stressBuster] = 0;
      }
      stressBusterCount[stressBuster] += 1;
    });
    console.log(stressBusterCount);
    const categories = Object.keys(stressBusterCount);
    const counts = Object.values(stressBusterCount);
    console.log("stress buster categories", categories);
    console.log("stress buster counts", counts);

    // sort category name by count
    categories.sort((a, b) => {
      // we use a custom sort function, so we sort based on the corresponding count
      const aCount = stressBusterCount[a];
      const bCount = stressBusterCount[b];
      return bCount > aCount ? 1 : bCount == aCount ? 0 : -1;
    });
    // get their count, in order to
    // we simply loop on categories, which is sorted now
    const sortedCounts = categories.map(
      (category) => stressBusterCount[category]
    );
    // keep only the top file values
    const bestCategories = categories.slice(0, 5);
    const bestCategoriesCounts = sortedCounts.slice(0, 5);

    // Chart will all thedata
    const chart = c3.generate({
      bindto: "#chart",
      data: {
        columns: [["Stress busters", ...bestCategoriesCounts]],
        type: "bar",
      },
      axis: {
        x: {
          type: "category",
          categories: bestCategories,
        },
      },
    });

    // Chart will all thedata
    //const chart = c3.generate({
    //  bindto: "#chart",
    //  data: {
    //    columns: [["Stress busters", ...counts]],
    //    type: "bar",
    //  },
    //  axis: {
    //    x: {
    //      type: "category",
    //      categories: categories,
    //    },
    //  },
    //});

    // An example chart
    // const chart = c3.generate({
    //   bindto: "#chart",
    //   data: {
    //     columns: [
    //       ["data1", 30, 200, 100, 400, 150, 250],
    //       ["data2", 50, 20, 10, 40, 15, 25],
    //     ],
    //   },
    // });
  });
});
