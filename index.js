var app = angular.module('app', []);

app.controller('appController', ($scope, $http) => {
    const wellIndex = 10; // known row number for batch header

    $scope.export = () => {
        var analysisDate = $scope.headerData.TimeofAnalysis.split(' ')[0].replace('\"', '').replace('\\', '');

        var batches = groupBy($scope.batchData, 'Description').map((group, i) => {
            return { id: group[0].Description, data: group };
        });

        // console.log(batches);

        batches.forEach((batch, i) => {
            var csvRows = [];

            batch.data.forEach((row, j) => {
                var csv = (row.SampleID || '') + ',' + analysisDate + ',' + (row.Result || '') + ',';

                csvRows.push(csv);
            });

            var exportPayload = csvRows.join('\r\n');

            return $http.post('/export', JSON.stringify({ id: batch.id, data: exportPayload }));
        });
    };

    $scope.saveInputFile = (data) => {
        console.log('no need to save this file');
        // return $http.post('/import', JSON.stringify(data));
    }

    $scope.fileIntake = () => {
        var fileInput = document.createElement('input');
        fileInput.setAttribute('type', 'file');
        fileInput.onchange = uploadHandler;
        fileInput.click();
    };

    var uploadHandler = (e) => {
        $scope.$apply(() => {
            var intakeFile = e.target.files[0];
            var intakeResult = e.target.result;

            console.log(intakeFile);

            var fileReader = new FileReader();
            fileReader.onload = (evt) => {
                var result = evt.target.result;

                $scope.processInputData(result);
                $scope.$apply();
                $scope.saveInputFile(result);
            };

            fileReader.readAsText(intakeFile);
        });
    };

    $scope.processInputData = (fileData) => {
        $scope.rowData = fileData.split('\r');

        $scope.rows = $scope.rowData.map((row) => {
            return row.split('\t');
        });

        var headerProperties = $scope.rowData.filter((row, i) => {
            return i < 10;
        }).map((row, i) => {
            row = row.replace(/\t/g, '');

            var propName = row.split(':')[0].replace(/\s/g, '');
            var rowValue = row.split(': ')[1] || '';

            return [propName, rowValue];
        });

        $scope.headerData = {};
        headerProperties.forEach((prop) => {
            $scope.headerData[prop[0]] = prop[1];
        });

        var batchProps = $scope.rows[10].map((cell) => {
            return cell.replace(/\s/g, '');
        });

        $scope.batchData = $scope.rows.filter((row, i) => {
            return i > 10;
        }).map((row, i) => {
            var obj = {};

            row.forEach((cell, j) => {
                obj[batchProps[j]] = cell;
            });

            // ignore results with these conditions
            if (!obj.SampleID || !obj.Description || obj.Description.toLowerCase().indexOf('batches') > -1) return null;

            // hardcode this value for positive results
            if (obj.Result.toLowerCase() == 'positive') obj.Result = 'Presumptive Positive';

            return obj;
        }).filter((row) => {
            return row != null;
        });

        // console.log($scope.batchData);
        // console.log($scope.headerData);
    };

    $scope.import = () => {
        $http.get('/txtfile')
            .then((response) => {
                // console.log(response);

                $scope.processInputData(response.data);
            }, (err) => {
                console.log(err);
            });
    };

    var groupBy = (collection, property) => {
        var i = 0, val, index,
            values = [], result = [];
        for (; i < collection.length; i++) {
            val = collection[i][property];
            index = values.indexOf(val);
            if (index > -1)
                result[index].push(collection[i]);
            else {
                values.push(val);
                result.push([collection[i]]);
            }
        }
        return result;
    };
});

app.filter('filterAnalysis', () => {
    return (input) => {
        return input.replace('\"', '').replace('\\', '');
    };
})
