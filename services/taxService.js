module.exports = (reqParams) => {

    const input = {
        monthlySalary: parseFloat(reqParams.monthlySalary, 10),
        year: parseInt(reqParams.year, 10)
    }

    return {
        getData: function() {
            const contriSSS = this.computeSSS();
            const contriPhilhealth = this.computePhilHealth();
            const contriPagibig = this.computePagibig();

            const taxableIncome = input.monthlySalary - (contriSSS.part.employee + contriPhilhealth.part.employee + contriPagibig.part.employee);
            const thirteenthMonthPayTaxableIncome = this.getThirteenthMonthPayTaxableIncome();

            const monthlyIncomeTax = this.computeMonthlyIncomeTax(taxableIncome);
            const completeMonthlyIncomeTax = this.computeMonthlyIncomeTax(taxableIncome + thirteenthMonthPayTaxableIncome);

            const thirteenthMonthPayTax = (completeMonthlyIncomeTax - monthlyIncomeTax) * 12;
            const totalYearlyIncomeTax = parseFloat(((completeMonthlyIncomeTax * 12)).toFixed(2), 10) - thirteenthMonthPayTax;
            const monthlyWithholdingTax = this.computeMonthlyWithholdingTax(taxableIncome);

            return {
                monthlyWithholdingTax: monthlyWithholdingTax,
                totalYearlyIncomeTax: totalYearlyIncomeTax,
                sss: contriSSS,
                philhealth: contriPhilhealth,
                pagibig: contriPagibig,
                thirteenthMonthPayTax: thirteenthMonthPayTax
            }
        },

        computeSSS: function() {
            const salaryCredit = this.getSalaryCredit(input.monthlySalary);
            return {
                whole: salaryCredit * 0.11,
                part: {
                    employee: Math.round(salaryCredit * (0.036 + 3 / 9000) * 10) / 10,
                    employer: Math.round(salaryCredit * (0.073 + 6 / 9000) * 10) / 10
                }
            };
        },

        computePhilHealth: function() {
            const philhealth = require('../configs/philhealthTable');
            const year = (input.year < 2018) ? 2018 :
                (input.year > 2024) ? 2024 : input.year;
            const salary = (input.monthlySalary <= 10000) ? 10000 :
                (input.monthlySalary > philhealth[year].maxSalary) ? philhealth[year].maxSalary : input.monthlySalary;
            const contribution = salary * philhealth[year].rate;

            return {
                whole: contribution,
                part: {
                    employee: contribution / 2,
                    employer: contribution / 2
                }
            }
        },

        computePagibig: function() {
            const percentage = (input.monthlySalary <= 1500) ? 0.02 : 0.01;
            const contribution = (input.monthlySalary > 1500) ? 100 : (input.monthlySalary * percentage);
            const employerContribution = input.monthlySalary * 0.02;

            return {
                whole: contribution + employerContribution,
                part: {
                    employee: contribution,
                    employer: employerContribution
                }
            };
        },

        computeMonthlyWithholdingTax: function(taxableIncome) {
            const taxCategory = this.getWithholdingTaxCategory(input.year, taxableIncome);
            return taxCategory.exemption + taxCategory.excessRate * (input.monthlySalary - taxCategory.minSalary);
        },

        computeMonthlyIncomeTax: function(salary) {
            const taxableIncomeAnual = salary * 12;
            if (taxableIncomeAnual <=  250000) {
                return 0;
            }

            const params = this.getIncomeTaxParam(taxableIncomeAnual);
            const yearType = input.year < 2023 ? 0 : 1;
            return (((taxableIncomeAnual - params.excessOver) * params.percentage[yearType]) + params.additional[yearType]) / 12;
        },

        getThirteenthMonthPayTaxableIncome: function() {
            if (input.year < 2018 && input.monthlySalary > 82000) {
                return (input.monthlySalary - 82000) / 12;
            } else if (input.year >= 2018 && input.monthlySalary > 90000) {
                return (input.monthlySalary - 90000) / 12;
            }
            return 0;
        },

        getWithholdingTaxCategory: function(year, salary) {
            const yearCategories = require("../configs/withholdingTaxTable");
            const yearCategory = yearCategories.find((category) => {
                if (category.minYear === null && year <= category.maxYear) {
                    return category;
                } else if (category.maxYear === null && year >= category.minYear) {
                    return category;
                } else if (year >= category.minYear && year <= category.maxYear) {
                    return category;
                }
            });

            return (yearCategory.categories).find((category) => {
                if (category.minSalary === null && salary <= category.maxSalary) {
                    return category;
                } else if (category.maxSalary === null && salary >= category.minSalary) {
                    return category;
                } else if (salary >= category.minSalary && salary <= category.maxSalary) {
                    return category;
                }
            });
        },

        getSalaryCredit: function (salary) {
            salary = (salary >= 15750) ? 15750 : salary;
            return (Math.ceil((salary - 1249.99) / 500) * 500) + 1000;
        },

        getIncomeTaxParam: function (annualSalary) {
            const taxCompute = require('../configs/incomeTaxTable');
            let index = null;

            if (annualSalary > 250000.01 && annualSalary < 400000) {
                index = 0;
            } else if (annualSalary > 400000.01 && annualSalary < 800000) {
                index = 1;
            } else if (annualSalary > 800000.01 && annualSalary < 2000000) {
                index = 2;
            } else if (annualSalary > 2000000.01 && annualSalary < 8000000) {
                index = 3;
            } else {
                index = 4;
            }

            return taxCompute[index];
        }

    }
};
