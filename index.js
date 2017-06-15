var app = angular.module('app', []);

app.controller('appController', ($scope, $http) => {
    const wellIndex = 10; // known row number for batch header

    $scope.export = () => {
        var analysisDate = $scope.headerData.TimeofAnalysis.split(' ')[0].replace('\"','').replace('\\','');

        var csvRows = [];

        $scope.batchData.forEach((row, i) => {
            var csv = (row.SampleID || '') + ',' + analysisDate + ',' + (row.Result || '') + ',';

            csvRows.push(csv);
        });

        var exportPayload = csvRows.join('\r\n');

        // console.log(exportPayload);

        // TODO: get this value dynamically
        var csvId = 12345;

        return $http.post('/export', JSON.stringify({id: csvId, data: exportPayload}));
    };

    $scope.saveInputFile = (data) => {
        return $http.post('/import', JSON.stringify(data));
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

            return obj;
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
});

app.filter('filterAnalysis', () => {
    return (input) => {
        return input.replace('\"','').replace('\\','');
    };
})