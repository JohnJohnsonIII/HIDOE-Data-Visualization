class App {
  #masterCopyCovidJSON;
  #covidJSON;
  #islandsSummary;
  #complexAreaSummary;
  #schoolNamesSummary;
  #datesSummary;
  #totalStaffAndStudents;
  #perCapitaInfection;
  #lastUpdate;
  #minDate;
  #maxDate;

  async loadData() {
    this.#masterCopyCovidJSON = await this._fetchJSON();
    this.#covidJSON = this.#masterCopyCovidJSON.slice();
    this.#lastUpdate = this._maxDate();
    this._createPage(this.#covidJSON);
  }
  _fetchJSON() {
    return new Promise((resolve, reject) => {
      var httpRequest = new XMLHttpRequest();
      if (!httpRequest) {
        alert("Error: Cannot create an XMLHTTP instance");
        return false;
      }
      httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState === XMLHttpRequest.DONE) {
          if (httpRequest.status === 200) {
            var returnVal = httpRequest.responseText.trim();
            if (returnVal.length != 0) {
              const sortedJSON = JSON.parse(returnVal)
                .slice()
                .sort(
                  (a, b) =>
                    a["Complex Area"]
                      .toUpperCase()
                      .localeCompare(b["Complex Area"].toUpperCase()) ||
                    a["School Name"]
                      .toUpperCase()
                      .localeCompare(b["School Name"].toUpperCase()) ||
                    Date.parse(a["Date Case Reported"]) >
                      Date.parse(b["Date Case Reported"])
                );

              resolve(sortedJSON);
            } else {
              reject("No data found.");
            }
          } else {
            reject("There was a problem with the request to retrieve data.");
          }
        }
      };
      httpRequest.open("GET", "JSON/data.json?random=" + Math.random());
      httpRequest.send();
    });
  }

  _minDate() {
    return this.#covidJSON.reduce(
      (acc, cur) =>
        Date.parse(cur["Date Case Reported"]) < Date.parse(acc)
          ? cur["Date Case Reported"]
          : acc,
      new Date()
    );
  }

  _maxDate() {
    return this.#covidJSON.reduce(
      (acc, cur) =>
        Date.parse(cur["Date Case Reported"]) > Date.parse(acc)
          ? cur["Date Case Reported"]
          : acc,
      "01/01/1970"
    );
  }
  _smoothDates(dataSet) {
    for (
      let start = new Date(this.#minDate);
      start <= new Date(this.#maxDate);
      start.setDate(start.getDate() + 1)
    ) {
      if (
        !(
          `${String(start.getFullYear())}/${String(
            start.getMonth() + 1
          ).padStart(2, "0")}/${String(start.getDate()).padStart(2, "0")}` in
          dataSet
        )
      ) {
        dataSet[
          `${String(start.getFullYear())}/${String(
            start.getMonth() + 1
          ).padStart(2, "0")}/${String(start.getDate()).padStart(2, "0")}`
        ] = 0;
      }
    }
    return dataSet;
  }
  _createSummary() {
    const body = document.getElementsByTagName("body")[0];
    let container = document.createElement("div");
    container.className = "summary-container";
    body.appendChild(container);
    let text = "<h1>Independent Data Visualization of HIDOE Covid Data</h1>";
    text += '<div class="flex-container">';
    text += `<div class='summary-flex-child-label'>Last Updated:</div><div class='summary-flex-child-data'> ${
      this.#lastUpdate
    }</div>`;
    text += '</div><div class="flex-container">';
    text += `<div class='summary-flex-child-label'>Date Ranges of Cases:</div><div class='summary-flex-child-data'> ${
      this.#minDate
    } ~ ${this.#maxDate}</div>`;
    text += '</div><div class="flex-container">';
    text += `<div class='summary-flex-child-label'>Case Count:</div><div class='summary-flex-child-data-count'> ${this._caseCount()}</div>`;
    text += '</div><div class="flex-container">';
    text += `<div class='summary-flex-child-label'>Maintained By:</div><div class='summary-flex-child-data'>John Johnson</div>`;
    text += "</div>";
    text += `Feel free to click on graph points to drill down into the data. Click on schools in the case list to see a complete list of cases as reported. <br>When you are ready to reset the data so you can drill down somewhere else, simply hit the reset button.<br><button>RESET DATA</button><br>Data for this visualization can be downloaded <a href='./JSON/data.json'>here</a>`;
    container.insertAdjacentHTML("afterBegin", text);
    document
      .getElementsByTagName("button")[0]
      .addEventListener("click", this._resetData.bind(this));
  }

  _resetData() {
    this.#covidJSON = this.#masterCopyCovidJSON;
    this._createPage();
  }
  _createPage() {
    this.#minDate = this._minDate();
    this.#maxDate = this._maxDate();
    this.#islandsSummary = this._countByCriteria("Island", this.#covidJSON);
    this.#complexAreaSummary = this._countByCriteria(
      "Complex Area",
      this.#covidJSON
    );
    this.#schoolNamesSummary = this._countByCriteria(
      "School Name",
      this.#covidJSON
    );
    this.#datesSummary = this._countByCriteria(
      "Date Case Reported",
      this.#covidJSON
    );
    this.#totalStaffAndStudents = this.#covidJSON.reduce((acc, cur) => {
      acc[cur["School Name"]] = cur["Total Staff & Students"];
      return acc;
    }, {});
    this.#perCapitaInfection = this.#covidJSON.reduce((acc, cur) => {
      if (this.#schoolNamesSummary[cur["School Name"]] != "N/A") {
        acc[cur["School Name"]] = (
          (this.#schoolNamesSummary[cur["School Name"]] /
            this.#totalStaffAndStudents[cur["School Name"]]) *
          100
        ).toFixed(2);
      }
      return acc;
    }, {});
    const body = document.getElementsByTagName("body")[0];
    body.innerHTML = "";
    this._createSummary();
    let container = document.createElement("div");
    container.className = "flex-container";
    body.appendChild(container);
    let chartDiv = document.createElement("div");
    container.appendChild(chartDiv);
    chartDiv.className = "flex-child";
    let canvas = document.createElement("canvas");
    canvas.id = `islandpiechartcanvas`;
    canvas.style.width = "200px";
    canvas.style.height = "500px";
    chartDiv.appendChild(canvas);
    this._insertPiechart(
      canvas,
      this.#islandsSummary,
      "Infection By Island",
      "Infections By Island",
      "Island"
    );
    chartDiv = document.createElement("div");
    container.appendChild(chartDiv);
    chartDiv.className = "flex-child";
    canvas = document.createElement("canvas");
    canvas.id = `schoolpiechartcanvas`;
    canvas.style.width = "200px";
    canvas.style.height = "500px";
    chartDiv.appendChild(canvas);

    const complexAreaPieChart = this._insertPiechart(
      canvas,
      this.#complexAreaSummary,
      "Complex Area Infections",
      "Complex Area Infections",
      "Complex Area"
    );

    container = document.createElement("div");
    document.getElementsByTagName("body")[0].appendChild(container);
    container.className = "flex-container";
    let chartdiv = document.createElement("div");
    chartdiv.className = "flex-child-bar";
    container.appendChild(chartdiv);
    canvas = document.createElement("canvas");
    canvas.id = `schoolbarchartcanvas`;
    canvas.style.width = "200px";
    canvas.style.height = "500px";
    chartdiv.appendChild(canvas);

    this._insertBarChart(
      canvas,
      this._sortObjectByKey(this.#schoolNamesSummary),
      "Infections By School",
      "School",
      "School Name"
    );

    container = document.createElement("div");
    document.getElementsByTagName("body")[0].appendChild(container);
    container.className = "flex-container";
    chartdiv = document.createElement("div");
    chartdiv.className = "flex-child-bar";
    container.appendChild(chartdiv);
    canvas = document.createElement("canvas");
    canvas.id = `percapitabarchartcanvas`;
    canvas.style.width = "200px";
    canvas.style.height = "500px";
    chartdiv.appendChild(canvas);

    this._insertBarChart(
      canvas,
      this._sortObjectByKey(this.#perCapitaInfection),
      "Per Capita Infections By School",
      "%",
      "School Name"
    );

    container = document.createElement("div");
    document.getElementsByTagName("body")[0].appendChild(container);
    container.className = "flex-container";
    chartdiv = document.createElement("div");
    chartdiv.className = "flex-child-bar";
    container.appendChild(chartdiv);
    canvas = document.createElement("canvas");
    canvas.id = `datesbarchartcanvas`;
    canvas.style.width = "200px";
    canvas.style.height = "500px";
    chartdiv.appendChild(canvas);

    this.#datesSummary = this._smoothDates(this.#datesSummary);
    const _sortedDates = Object.keys(
      this._sortObjectByKey(this.#datesSummary)
    ).reduce((acc, cur, index, array) => {
      const newdate = new Date(cur);
      const options = {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      };
      acc[newdate.toLocaleString("en-US", options)] = this.#datesSummary[cur];
      return acc;
    }, {});

    this._insertBarChart(
      canvas,
      _sortedDates,
      "Infections By Date Reported",
      "Count",
      "Date Case Reported"
    );
    this._displayCases();
  }

  _createSchoolLine(schoolName, total) {
    const line = document.createElement("div");
    line.classList.add("flex-container-schoolname", "accordion");
    const schoolname = document.createElement("div");
    schoolname.innerHTML = schoolName;
    schoolname.className = "flex-child-ca1";
    line.appendChild(schoolname);
    const count = document.createElement("div");
    count.innerHTML = total;
    count.className = "flex-child-ca2";
    line.appendChild(count);
    return line;
  }

  _createSchoolPanel(datapoint) {
    const line = document.createElement("div");
    line.classList.add("flex-container-schoolpanel", "panel");
    line.id = datapoint["School Name"];
    return line;
  }

  _createSchoolPanelHeader() {
    const line = document.createElement("div");
    line.classList.add("flex-container-dataline");
    const complexarea = document.createElement("div");
    complexarea.innerHTML = "Complex Area";
    complexarea.className = "flex-child-dl-complex-header";
    line.appendChild(complexarea);

    const schoolname = document.createElement("div");
    schoolname.innerHTML = "School Name";
    schoolname.className = "flex-child-dl-schoolname-header";
    line.appendChild(schoolname);

    const casecount = document.createElement("div");
    casecount.innerHTML = "Case Count";
    casecount.className = "flex-child-dl-casecount-header";
    line.appendChild(casecount);

    const datereported = document.createElement("div");
    datereported.innerHTML = "Date Case Reported";
    datereported.className = "flex-child-dl-datereported-header";
    line.appendChild(datereported);

    const lastdate = document.createElement("div");
    lastdate.innerHTML = "Last Date Individual was on a HIDOE Campus";
    lastdate.className = "flex-child-dl-datelast-header";
    line.appendChild(lastdate);

    const island = document.createElement("div");
    island.innerHTML = "Island";
    island.className = "flex-child-dl-island-header";
    line.appendChild(island);
    return line;
  }

  _createSchoolDataLine(datapoint) {
    const line = document.createElement("div");
    line.classList.add("flex-container-dataline");
    const complexarea = document.createElement("div");
    complexarea.innerHTML = datapoint["Complex Area"];
    complexarea.className = "flex-child-dl-complex";
    line.appendChild(complexarea);

    const schoolname = document.createElement("div");
    schoolname.innerHTML = datapoint["School Name"];
    schoolname.className = "flex-child-dl-schoolname";
    line.appendChild(schoolname);

    const casecount = document.createElement("div");
    casecount.innerHTML = datapoint["Case Count"];
    casecount.className = "flex-child-dl-casecount";
    line.appendChild(casecount);

    const datereported = document.createElement("div");
    datereported.innerHTML = datapoint["Date Case Reported"];
    datereported.className = "flex-child-dl-datereported";
    line.appendChild(datereported);

    const lastdate = document.createElement("div");
    lastdate.innerHTML =
      datapoint["Last Date Individual was on a HIDOE Campus"];
    lastdate.className = "flex-child-dl-datelast";
    line.appendChild(lastdate);

    const island = document.createElement("div");
    island.innerHTML = datapoint["Island"];
    island.className = "flex-child-dl-island";
    line.appendChild(island);
    return line;
  }

  _countByCriteria(criteria, dataSet) {
    return dataSet.reduce((acc, cur) => {
      if (cur[criteria] in acc) {
        acc[cur[criteria]] += Number(cur["Case Count"]);
      } else {
        acc[cur[criteria]] = Number(cur["Case Count"]);
      }
      return acc;
    }, {});
  }

  _createComplexLine(complexArea, total) {
    const line = document.createElement("div");
    line.className = "flex-container-complexarea";
    const complexAreaDiv = document.createElement("div");
    complexAreaDiv.innerHTML = complexArea;
    complexAreaDiv.className = "flex-child-ca1";
    line.appendChild(complexAreaDiv);
    const count = document.createElement("div");
    count.innerHTML = total;
    count.className = "flex-child-ca2";
    line.appendChild(count);
    return line;
  }

  _displayCases() {
    let lastComplex = "";
    let lastSchool = "";
    let body = document.getElementsByTagName("body")[0];
    let space = document.createElement("br");
    body.appendChild(space);
    const line = document.createElement("div");
    line.className = "flex-container-casesheader";
    line.innerHTML = "School Case Reports - Click School To View Case Listing";
    body.appendChild(line);
    let dataDetails = document.createElement("div");
    body.appendChild(dataDetails);
    let currentSchoolPanel;
    this.#covidJSON.forEach((datapoint) => {
      if (datapoint["Complex Area"] !== lastComplex) {
        dataDetails.appendChild(
          this._createComplexLine(
            datapoint["Complex Area"],
            this.#complexAreaSummary[datapoint["Complex Area"]]
          )
        );
        lastComplex = datapoint["Complex Area"];
      }
      if (datapoint["School Name"] !== lastSchool) {
        dataDetails.appendChild(
          this._createSchoolLine(
            datapoint["School Name"],
            this.#schoolNamesSummary[datapoint["School Name"]]
          )
        );
        currentSchoolPanel = this._createSchoolPanel(datapoint);
        dataDetails.appendChild(currentSchoolPanel);
        currentSchoolPanel.appendChild(this._createSchoolPanelHeader());
        lastSchool = datapoint["School Name"];
      }
      currentSchoolPanel.appendChild(this._createSchoolDataLine(datapoint));
    });
    document.querySelectorAll(".accordion").forEach(function (line) {
      line.addEventListener("click", (e) => {
        const accordion = e.currentTarget;
        const panel = accordion.nextSibling;
        // document.getElementById("panel-" + schoolname);
        if (panel.style.display == "block") {
          panel.style.display = "none";
        } else {
          panel.style.display = "block";
        }
        if (panel.style.maxHeight) {
          panel.style.maxHeight = null;
        } else {
          panel.style.maxHeight = panel.scrollHeight + "px";
        }
      });
    });
  }

  _makeRandomColor() {
    let min = Math.ceil(255);
    let max = Math.floor(0);
    let text = "rgb(";
    for (let j = 0; j < 3; j++) {
      text += Math.floor(Math.random() * (max - min + 1) + min) + " ,";
    }
    text = text.slice(0, -1) + ")";
    return text;
  }

  _sortObjectByKey(theobject) {
    return Object.keys(theobject)
      .sort()
      .reduce((obj, key) => {
        obj[key] = theobject[key];
        return obj;
      }, {});
  }
  _makeColorPalette(paletteType, itemlist) {
    let colorlist = [];
    let palette;
    const islandColors = {
      Hawaii: "rgb(255, 0, 0)",
      Oahu: "rgb(255, 255, 0)",
      Kauai: "rgb(128,0,128)",
      Lanai: "rgb(255,165,0)",
      Maui: "rgb(255, 192, 203)",
      Molokai: "rgb(0,128,0)",
    };
    const complexColors = {
      "Aiea-Moanalua-Radford": "rgb(87,87,87)",
      "Baldwin-Kekaulike-Maui": "rgb(173,35,35)",
      "Campbell-Kapolei": "rgb(42,75,215)",
      "Castle-Kahuku": "rgb(29,105,20)",
      "Farrington-Kaiser-Kalani": "rgb(129,74,25)",
      "Hana-Lahainaluna-Lanai-Molokai": "rgb(129,38,192)",
      "Hilo-Waiakea": "rgb(160,160,160)",
      "Honokaa-Kealakehe-Kohala-Konawaena": "rgb(129,197,122)",
      "Kailua-Kalaheo": "rgb(157,175,255)",
      "Kaimuki-McKinley-Roosevelt": "rgb(41,208,208)",
      "Kaimuki-McKinley-Roosevelt": "rgb(255,146,51)",
      "Kapaa-Kauai-Waimea": "rgb(255,238,51)",
      "Kau-Keaau-Pahoa": "rgb(233,222,187)",
      "Leeward District": "rgb(255,205,243)",
      "Leilehua-Mililani-Waialua": "rgb(255,0,255)",
      "Nanakuli-Waianae": "rgb(34,87,34)",
      "Pearl City-Waipahu": "rgb(50,205,50)",
      "State Office": "rgb(0,0,0)",
    };

    if (paletteType == "Infection By Island") {
      palette = islandColors;
    } else if (paletteType == "Complex Area Infections") {
      palette = complexColors;
    }
    for (const item in itemlist) {
      if (itemlist[item] in palette) {
        colorlist.push(palette[itemlist[item]]);
      } else {
        colorlist.push(this._makeRandomColor());
      }
    }
    return colorlist;
  }

  _insertPiechart(
    canvasEl,
    dataSummary,
    paletteType = "Infection By Island",
    label,
    filterType
  ) {
    const orderedLabels = Object.keys(dataSummary).sort();

    const thechart = canvasEl.getContext("2d");
    const piechartData = {
      labels: Object.keys(dataSummary),
      datasets: [
        {
          label: label,
          data: Object.values(dataSummary),
          backgroundColor: this._makeColorPalette(
            paletteType,
            Object.keys(dataSummary)
          ),
          hoverOffset: 4,
        },
      ],
    };
    const chartConfig = {
      type: "pie",
      data: piechartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,

        onClick: (e, el, mychart) => {
          var points = mychart.getElementsAtEventForMode(
            e,
            "nearest",
            { intersect: true },
            true
          );
          if (points.length) {
            const firstPoint = points[0];
            const selectedLabel = mychart.data.labels[firstPoint.index];
            console.log(selectedLabel);
            this.#covidJSON = this.#covidJSON.filter(
              (val, index, array) => val[filterType] == selectedLabel
            );
            this._createPage();
            var value =
              mychart.data.datasets[firstPoint.datasetIndex].data[
                firstPoint.index
              ];
          }
          // Substitute the appropriate scale IDs
        },
        plugins: {
          legend: {
            display: true,
            position: "right",
            labels: {
              boxWidth: 10,
            },
          },
          title: {
            display: true,
            text: label,
            font: {
              size: 20,
              weight: "bolder",
            },
            padding: {
              top: 10,
              bottom: 30,
            },
          },
        },
      },
    };
    const theChart = new Chart(thechart, chartConfig);
  }

  _caseCount() {
    return this.#covidJSON.reduce(
      (acc, cur) => acc + Number(cur["Case Count"]),
      0
    );
  }
  _insertBarChart(canvasEl, dataSummary, chartTitle, label, filterType) {
    const thechart = canvasEl.getContext("2d");

    const chart = new Chart(canvasEl, {
      type: "bar",
      data: {
        labels: Object.keys(dataSummary),
        datasets: [
          {
            label: label,
            data: Object.values(dataSummary),
            backgroundColor: ["rgb(255, 0, 0)"],
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (e, el, mychart) => {
          var points = mychart.getElementsAtEventForMode(
            e,
            "nearest",
            { intersect: true },
            true
          );
          if (points.length) {
            const firstPoint = points[0];
            const selectedLabel = mychart.data.labels[firstPoint.index];
            this.#covidJSON = this.#covidJSON.filter((val, index, array) =>
              isNaN(Date.parse(selectedLabel))
                ? val[filterType] == selectedLabel
                : Date.parse(val[filterType]) == Date.parse(selectedLabel)
            );

            this._createPage();
            var value =
              mychart.data.datasets[firstPoint.datasetIndex].data[
                firstPoint.index
              ];
          }
          // Substitute the appropriate scale IDs
        },
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: chartTitle,
            font: {
              size: 20,
              weight: "bolder",
            },
            padding: {
              top: 10,
              bottom: 30,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
      plugins: {},
    });
  }
}

window.onload = function () {
  covidApp = new App(); //initializePage;
  covidApp.loadData();
};
