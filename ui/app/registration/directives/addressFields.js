'use strict';

angular.module('bahmni.registration')
    .directive('addressFields', function () {
        var template = '<section class="form-field-inline" ng-repeat="addressLevels in addressLevelsChunks">' +
            '<article class="form-field" ng-repeat="addressLevel in addressLevels">' +
            '<div class="field-attribute">' +
            '<label for="{{addressLevel.addressField}}">{{addressLevel.name}}<span class="asterick" ng-show="addressLevel.required">*</span></label>' +
            '</div>' +
            '<div class="field-value">' +
            '<input type="text" id="{{addressLevel.addressField}}"  pattern-validate non-blank="addressLevel.required" ng-model="address[addressLevel.addressField]" placeholder="{{addressLevel.name}}"' +
            'bahmni-autocomplete source="getAddressEntryList(addressLevel.addressField)" response-map="getAddressDataResults" on-select="addressFieldSelected(addressLevel.addressField)" ng-change="clearFields(addressLevel.addressField)"' +
            '>' +
            '</div>' +
            '</article>' +
            '</section>';
        return {
            restrict: 'AE',
            template: template,
            controller: 'AddressFieldsDirectiveController',
            scope: {
                address: '=',
                addressLevels: '=',
                fieldValidation: '='
            }
        };
    })
    .controller('AddressFieldsDirectiveController', function ($scope, addressAttributeService) {
        var addressLevelsCloneInDescendingOrder = $scope.addressLevels.slice(0).reverse()
        $scope.addressLevelsChunks = Bahmni.Common.Util.ArrayUtil.chunk(addressLevelsCloneInDescendingOrder, 2)
        var addressLevelsNamesInDescendingOrder = addressLevelsCloneInDescendingOrder.map(function (addressLevel) {
            return addressLevel.addressField;
        });
        var autocompletedFields = [];
        $scope.addressFieldSelected = function (fieldName) {
            return function (addressFieldItem) {
                var parentFields = addressLevelsNamesInDescendingOrder.slice(addressLevelsNamesInDescendingOrder.indexOf(fieldName) + 1);
                var parent = addressFieldItem.addressField.parent;
                parentFields.forEach(function (parentField) {
                    if (!parent) return;
                    $scope.address[parentField] = parent.name;
                    parent = parent.parent;
                });
                autocompletedFields = [];
                autocompletedFields.push(fieldName);
                autocompletedFields = autocompletedFields.concat(parentFields);
            }
        };

        $scope.getAddressEntryList = function (field) {
            return function (searchAttrs) {
                return addressAttributeService.search(field, searchAttrs.term);
            };
        };

        var getNextAvailableParentName = function (addressField) {
            var parent = addressField.parent;
            while (parent) {
                if (parent.name) return parent.name;
                else parent = parent.parent;
            }
        };

        $scope.getAddressDataResults = function (data) {
            return data.data.map(function (addressField) {
                var parentName = getNextAvailableParentName(addressField);
                return {
                    'value': addressField.name,
                    'label': addressField.name + ( parentName ? ", " + parentName : "" ),
                    addressField: addressField
                }
            });
        };
        $scope.clearFields = function (fieldName) {
            if(_.contains(autocompletedFields, fieldName)) {
                var childFields = autocompletedFields.slice(0, autocompletedFields.indexOf(fieldName));
                childFields.forEach(function (childField) {
                    $scope.address[childField] = "";
                });
            }
        };
    });
