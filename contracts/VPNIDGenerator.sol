// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract VPNIDGenerator is Ownable {
    using SafeERC20 for IERC20;
    struct UserInfo {
        address user;
        string paymentId;
        string packageType;
    }

    IERC20 private immutable i_svpnToken;

    uint256 public nextID;
    uint256 public constant IDLength = 15;
    uint256 public paymentAmountMonthly;
    uint256 public paymentAmountYearly;
    uint256 public s_totalYearlySales;
    uint256 public s_totalYearlySalesValue;
    uint256 public s_totalMonthlySales;
    uint256 public s_totalMonthlySalesValue;
    uint256 public s_totalOverallSales;
    uint256 public s_totalOverallSalesValue;
    uint256 public constant SVPN_DECIMALS = 1e18;

    event IDGenerated(
        address indexed payer,
        string generatedID,
        string paymentType
    );
    event MonthlyPaymentAmountUpdated(uint256 newPaymentAmount);
    event YearlyPaymentAmountUpdated(uint256 newPaymentAmount);

    // Mapping to store arrays of user IDs
    mapping(address => string[]) private _userIDs;
    mapping(address => UserInfo[]) private s_userToUserInfo;

    constructor(
        address _svpnTOken,
        uint256 _initialPaymentMonthlyAmount,
        uint256 _initialPaymentYearlyAmount,
        uint256 _totalYearlySales,
        uint256 _totalMonthlySales,
        uint256 _totalOverallSales
    ) Ownable(msg.sender) {
        i_svpnToken = IERC20(_svpnTOken);
        paymentAmountMonthly = _initialPaymentMonthlyAmount * SVPN_DECIMALS;
        paymentAmountYearly = _initialPaymentYearlyAmount * SVPN_DECIMALS;
        nextID = 1;
        s_totalYearlySales = _totalYearlySales;
        s_totalMonthlySales = _totalMonthlySales;
        s_totalOverallSales = _totalOverallSales;
    }

    function payForUniqueIDMonthly() external {
        require(
            i_svpnToken.balanceOf(msg.sender) >= paymentAmountMonthly,
            "Not enough balance"
        );
        i_svpnToken.safeTransferFrom(
            msg.sender,
            address(this),
            paymentAmountMonthly
        );
        string memory generatedID = generateUniqueID();
        _userIDs[msg.sender].push(generatedID);
        s_userToUserInfo[msg.sender].push(
            UserInfo({
                user: msg.sender,
                paymentId: generatedID,
                packageType: "Monthly"
            })
        );
        s_totalMonthlySalesValue += paymentAmountMonthly;
        s_totalOverallSalesValue += paymentAmountMonthly;
        s_totalMonthlySales += 1;
        emit IDGenerated(msg.sender, generatedID, "Monthly");
    }

    function payForUniqueIDYearly() external {
        require(
            i_svpnToken.balanceOf(msg.sender) >= paymentAmountYearly,
            "Incorrect payment amount"
        );
        i_svpnToken.safeTransferFrom(
            msg.sender,
            address(this),
            paymentAmountYearly
        );
        string memory generatedID = generateUniqueID();
        _userIDs[msg.sender].push(generatedID);
        s_userToUserInfo[msg.sender].push(
            UserInfo({
                user: msg.sender,
                paymentId: generatedID,
                packageType: "Yearly"
            })
        );
        s_totalYearlySalesValue += paymentAmountYearly;
        s_totalOverallSalesValue += paymentAmountYearly;
        s_totalYearlySales += 1;
        emit IDGenerated(msg.sender, generatedID, "Yearly");
    }

    function generateUniqueID() internal returns (string memory) {
        bytes memory characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        bytes memory result = new bytes(IDLength);
        bool unique;
        uint256 attempts = 0;

        do {
            bytes32 hash = keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    msg.sender,
                    nextID,
                    attempts
                )
            );
            unique = true;

            for (uint256 i = 0; i < IDLength; i++) {
                uint256 randIndex = uint256(uint8(hash[i % 32])) %
                    characters.length;
                result[i] = characters[randIndex];
            }

            string memory newID = string(result);
            for (uint256 i = 0; i < _userIDs[msg.sender].length; i++) {
                if (
                    keccak256(abi.encodePacked(_userIDs[msg.sender][i])) ==
                    keccak256(abi.encodePacked(newID))
                ) {
                    unique = false;
                    break;
                }
            }

            attempts++;
        } while (!unique && attempts < 10); // Prevent infinite loops

        require(
            unique,
            "Failed to generate a unique ID after several attempts."
        );
        nextID++;
        return string(result);
    }

    function withdrawETH() external onlyOwner {
        require(i_svpnToken.balanceOf(address(this)) > 0, "Not enough Balance");
        uint256 amountToWithdraw = i_svpnToken.balanceOf(address(this));
        i_svpnToken.safeTransferFrom(
            address(this),
            msg.sender,
            amountToWithdraw
        );
    }

    function updateMonthlyPaymentAmount(
        uint256 _newPaymentAmount
    ) external onlyOwner {
        require(_newPaymentAmount > 0, "Invalid payment amount");
        uint256 newPaymentAmountDecAdjusted = _newPaymentAmount * SVPN_DECIMALS;
        paymentAmountMonthly = newPaymentAmountDecAdjusted;
        emit MonthlyPaymentAmountUpdated(_newPaymentAmount);
    }

    function updateYearlyPaymentAmount(
        uint256 _newPaymentAmount
    ) external onlyOwner {
        require(_newPaymentAmount > 0, "Invalid payment amount");
        uint256 newPaymentAmountDecAdjusted = _newPaymentAmount * SVPN_DECIMALS;
        paymentAmountYearly = newPaymentAmountDecAdjusted;
        emit YearlyPaymentAmountUpdated(_newPaymentAmount);
    }

    function getUserIDs(address user) external view returns (string[] memory) {
        return _userIDs[user];
    }

    function getUserInfo(
        address _user
    ) public view returns (UserInfo[] memory) {
        return s_userToUserInfo[_user];
    }

    function getTotalYearlySales() public view returns (uint256) {
        return s_totalYearlySales;
    }

    function getTotalMonthlySales() public view returns (uint256) {
        return s_totalMonthlySales;
    }

    function getOverallSales() public view returns (uint256) {
        return s_totalMonthlySales + s_totalYearlySales;
    }

    function getTotalYearlySalesValue() public view returns (uint256) {
        return s_totalYearlySalesValue;
    }

    function getTotalMonthlySalesValue() public view returns (uint256) {
        return s_totalMonthlySalesValue;
    }

    function getTotalOverallSalesValue() public view returns (uint256) {
        return s_totalYearlySalesValue + s_totalMonthlySalesValue;
    }
}
