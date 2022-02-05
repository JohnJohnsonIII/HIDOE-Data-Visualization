# HIDOE-Data-Visualization
Data converter and Javascript visualization for Hawaii Department of Education Covid-19 data.

This project consists of two parts. The first is doeparse.py, located in the PY directory. Run this from the command line with the name of the xlsx file to parse.
My current process for obtaining the data from HIDOE is to go to their data visualization, downloading the data as a PDF, then converting the PDF to xlsx using Adobe Acrobat's online converter. At that point, run the following command in the PY directory:
python doeparse.py List.xlsx
This will import the data from the Excel file and convert to a JSON file named data.json. Put this file into the JSON directory.
The rest of these files and directories get uploaded to a web server and then simply point to that URL. Example:
https://hawaiicoder.com/index.html
